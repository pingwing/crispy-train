import type { SqlEntityManager } from '@mikro-orm/postgresql';
import { raw } from '@mikro-orm/core';
import {
  InventoryItem as InventoryItemEntity,
  Product as ProductEntity,
  Store as StoreEntity,
} from '../db/entities';
import { asMoneyString, InventoryItem, Store } from '../domain';
import { toDomainInventoryItem, toDomainStore } from './mappers';

export type InventoryItemFilter = {
  storeId?: string;
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  minQuantity?: number;
  maxQuantity?: number;
};

export type InventoryItemSort = {
  field:
    | 'STORE_NAME'
    | 'PRODUCT_NAME'
    | 'CATEGORY'
    | 'PRICE'
    | 'QUANTITY'
    | 'VALUE';
  direction?: 'ASC' | 'DESC';
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type StoreInventorySummary = {
  store: Store;
  totalSkus: number;
  totalQuantity: number;
  totalValue: string;
  lowStockCount: number;
};

export interface IInventoryRepository {
  listInventoryItems(
    filter: InventoryItemFilter,
    page: number,
    pageSize: number,
    sort?: InventoryItemSort,
  ): Promise<Paged<InventoryItem>>;
  upsertInventoryItem(input: {
    storeId: string;
    productId: string;
    price: string;
    quantity: number;
  }): Promise<InventoryItem | null>;
  storeInventorySummary(storeId: string): Promise<StoreInventorySummary | null>;
}

export class InventoryRepository implements IInventoryRepository {
  constructor(private readonly em: SqlEntityManager) {}

  async listInventoryItems(
    filter: InventoryItemFilter,
    page: number,
    pageSize: number,
    sort?: InventoryItemSort,
  ): Promise<Paged<InventoryItem>> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const qb = this.em
      .createQueryBuilder(InventoryItemEntity, 'ii')
      .leftJoinAndSelect('ii.product', 'p')
      .leftJoinAndSelect('ii.store', 's');

    if (filter.storeId) qb.andWhere({ store: filter.storeId });
    if (filter.category) qb.andWhere({ 'p.category': filter.category });
    if (filter.minQuantity != null)
      qb.andWhere({ quantity: { $gte: filter.minQuantity } });
    if (filter.maxQuantity != null)
      qb.andWhere({ quantity: { $lte: filter.maxQuantity } });
    if (filter.search) {
      const like = `%${filter.search}%`;
      qb.andWhere({
        $or: [{ 'p.name': { $ilike: like } }, { 's.name': { $ilike: like } }],
      });
    }
    if (filter.minPrice != null)
      qb.andWhere({ price: { $gte: filter.minPrice } });
    if (filter.maxPrice != null)
      qb.andWhere({ price: { $lte: filter.maxPrice } });

    const dir = (sort?.direction ?? 'ASC') === 'DESC' ? 'desc' : 'asc';
    // Always include a stable tie-breaker so pagination is deterministic.
    const stable = { 's.name': 'asc', 'p.name': 'asc', 'ii.id': 'asc' } as const;

    if (!sort) {
      qb.orderBy(stable);
    } else if (sort.field === 'STORE_NAME') {
      qb.orderBy({ 's.name': dir, 'p.name': 'asc', 'ii.id': 'asc' });
    } else if (sort.field === 'PRODUCT_NAME') {
      qb.orderBy({ 'p.name': dir, 's.name': 'asc', 'ii.id': 'asc' });
    } else if (sort.field === 'CATEGORY') {
      qb.orderBy({ 'p.category': dir, 'p.name': 'asc', 's.name': 'asc', 'ii.id': 'asc' });
    } else if (sort.field === 'PRICE') {
      qb.orderBy({ 'ii.price': dir, ...stable } as any);
    } else if (sort.field === 'QUANTITY') {
      qb.orderBy({ 'ii.quantity': dir, ...stable } as any);
    } else if (sort.field === 'VALUE') {
      // price is stored as numeric, so quantity * price works as numeric in Postgres.
      qb.orderBy({ [raw('(ii.quantity * ii.price)') as any]: dir, ...stable } as any);
    } else {
      qb.orderBy(stable);
    }
    qb.offset(offset).limit(safePageSize);

    const [entities, total] = await qb.getResultAndCount();
    return {
      items: entities.map(toDomainInventoryItem),
      total,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  async upsertInventoryItem(input: {
    storeId: string;
    productId: string;
    price: string;
    quantity: number;
  }): Promise<InventoryItem | null> {
    const store = await this.em.findOne(StoreEntity, { id: input.storeId });
    if (!store) return null;
    const product = await this.em.findOne(ProductEntity, {
      id: input.productId,
    });
    if (!product) return null;

    let item = await this.em.findOne(
      InventoryItemEntity,
      { store: store.id, product: product.id },
      { populate: ['store', 'product'] as const },
    );
    if (!item) {
      item = this.em.create(InventoryItemEntity, {
        store,
        product,
        price: input.price,
        quantity: input.quantity,
      });
      await this.em.persist(item).flush();
      await this.em.populate(item, ['store', 'product'] as const);
      return toDomainInventoryItem(item);
    }

    item.price = input.price;
    item.quantity = input.quantity;
    await this.em.persist(item).flush();
    return toDomainInventoryItem(item);
  }

  async storeInventorySummary(
    storeId: string,
  ): Promise<StoreInventorySummary | null> {
    const storeEntity = await this.em.findOne(StoreEntity, { id: storeId });
    if (!storeEntity) return null;

    const rows = await this.em
      .createQueryBuilder(InventoryItemEntity, 'ii')
      .select([
        // Use raw SQL snippets for aggregates; otherwise MikroORM will quote them as identifiers
        // (e.g. "count(ii"."id)") which breaks in Postgres.
        raw('count(ii.id) as total_skus'),
        raw('coalesce(sum(ii.quantity), 0) as total_quantity'),
        raw('coalesce(sum(ii.quantity * ii.price), 0) as total_value'),
        raw(
          'coalesce(sum(case when ii.quantity <= 5 then 1 else 0 end), 0) as low_stock_count',
        ),
      ])
      .where({ store: storeEntity.id })
      .execute('get');

    const row = rows as any;
    return {
      store: toDomainStore(storeEntity),
      totalSkus: Number(row.total_skus ?? 0),
      totalQuantity: Number(row.total_quantity ?? 0),
      totalValue: asMoneyString(row.total_value ?? 0),
      lowStockCount: Number(row.low_stock_count ?? 0),
    };
  }
}
