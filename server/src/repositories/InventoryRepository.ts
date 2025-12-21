import type { SqlEntityManager } from '@mikro-orm/postgresql';
import {
  UniqueConstraintViolationException,
  ForeignKeyConstraintViolationException,
  raw,
} from '@mikro-orm/core';
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
  deleteInventoryItem(input: {
    storeId: string;
    productId: string;
  }): Promise<boolean>;
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

  private isUniqueViolation(e: unknown): boolean {
    if (e instanceof UniqueConstraintViolationException) return true;
    const err = e as { code?: unknown; cause?: { code?: unknown } };
    return err?.code === '23505' || err?.cause?.code === '23505';
  }

  private isForeignKeyViolation(e: unknown): boolean {
    if (e instanceof ForeignKeyConstraintViolationException) return true;
    const err = e as { code?: unknown; cause?: { code?: unknown } };
    // Postgres foreign_key_violation
    return err?.code === '23503' || err?.cause?.code === '23503';
  }

  async deleteInventoryItem(input: {
    storeId: string;
    productId: string;
  }): Promise<boolean> {
    const deleted = await this.em.nativeDelete(InventoryItemEntity, {
      store: { id: input.storeId },
      product: { id: input.productId },
    });
    return deleted > 0;
  }

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
    if (filter.category) {
      const like = `%${filter.category}%`;
      qb.andWhere({ 'p.category': { $ilike: like } });
    }
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
    const stable = {
      's.name': 'asc',
      'p.name': 'asc',
      'ii.id': 'asc',
    } as const;

    if (!sort) {
      qb.orderBy(stable);
    } else if (sort.field === 'STORE_NAME') {
      qb.orderBy({ 's.name': dir, 'p.name': 'asc', 'ii.id': 'asc' });
    } else if (sort.field === 'PRODUCT_NAME') {
      qb.orderBy({ 'p.name': dir, 's.name': 'asc', 'ii.id': 'asc' });
    } else if (sort.field === 'CATEGORY') {
      qb.orderBy({
        'p.category': dir,
        'p.name': 'asc',
        's.name': 'asc',
        'ii.id': 'asc',
      });
    } else if (sort.field === 'PRICE') {
      qb.orderBy({ 'ii.price': dir, ...stable });
    } else if (sort.field === 'QUANTITY') {
      qb.orderBy({ 'ii.quantity': dir, ...stable });
    } else if (sort.field === 'VALUE') {
      // price is stored as numeric, so quantity * price works as numeric in Postgres.
      const valueExpr = raw('(ii.quantity * ii.price)');
      qb.orderBy({
        [valueExpr as unknown as string]: dir,
        ...stable,
      });
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
    let item = await this.em.findOne(
      InventoryItemEntity,
      { store: { id: input.storeId }, product: { id: input.productId } },
      { populate: ['store', 'product'] as const },
    );
    if (!item) {
      // Avoid redundant DB reads: use references (FK constraints will validate on flush).
      const storeRef = this.em.getReference(StoreEntity, input.storeId);
      const productRef = this.em.getReference(ProductEntity, input.productId);
      item = this.em.create(InventoryItemEntity, {
        store: storeRef,
        product: productRef,
        price: input.price,
        quantity: input.quantity,
      });
      try {
        await this.em.persist(item).flush();
      } catch (e) {
        // Missing store/product (deleted concurrently, etc.)
        if (this.isForeignKeyViolation(e)) return null;
        // Race: two writers try to insert same (store,product) concurrently.
        if (this.isUniqueViolation(e)) {
          const existing = await this.em.findOne(
            InventoryItemEntity,
            { store: { id: input.storeId }, product: { id: input.productId } },
            { populate: ['store', 'product'] as const },
          );
          if (!existing) throw e;
          existing.price = input.price;
          existing.quantity = input.quantity;
          await this.em.persist(existing).flush();
          return toDomainInventoryItem(existing);
        }
        throw e;
      }
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

    const row = rows as unknown as {
      total_skus?: string | number | null;
      total_quantity?: string | number | null;
      total_value?: string | number | null;
      low_stock_count?: string | number | null;
    };
    return {
      store: toDomainStore(storeEntity),
      totalSkus: Number(row.total_skus ?? 0),
      totalQuantity: Number(row.total_quantity ?? 0),
      totalValue: asMoneyString(row.total_value ?? 0),
      lowStockCount: Number(row.low_stock_count ?? 0),
    };
  }
}
