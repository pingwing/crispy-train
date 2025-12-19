import { asMoneyString, InventoryItem } from '../../domain';
import type {
  IInventoryRepository,
  InventoryItemFilter,
  InventoryItemSort,
  Paged,
  StoreInventorySummary,
} from '../InventoryRepository';
import type { MemoryDb } from './memoryDb';
import { newId } from '../../utils/ids';

export class MemoryInventoryRepository implements IInventoryRepository {
  constructor(private readonly db: MemoryDb) {}

  async listInventoryItems(
    filter: InventoryItemFilter,
    page: number,
    pageSize: number,
    sort?: InventoryItemSort,
  ): Promise<Paged<InventoryItem>> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const rows = [...this.db.inventoryByStoreProduct.values()];

    const filtered = rows.filter((ii) => {
      if (filter.storeId && ii.store.id !== filter.storeId) return false;
      if (filter.category) {
        const q = filter.category.toLowerCase();
        if (!ii.product.category.toLowerCase().includes(q)) return false;
      }
      if (filter.minQuantity != null && ii.quantity < filter.minQuantity)
        return false;
      if (filter.maxQuantity != null && ii.quantity > filter.maxQuantity)
        return false;

      if (filter.search) {
        const q = filter.search.toLowerCase();
        const hay = `${ii.product.name} ${ii.store.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      const priceN = Number(ii.price);
      if (filter.minPrice != null && priceN < Number(filter.minPrice))
        return false;
      if (filter.maxPrice != null && priceN > Number(filter.maxPrice))
        return false;

      return true;
    });

    const dir = (sort?.direction ?? 'ASC') === 'DESC' ? -1 : 1;
    const stableCmp = (a: InventoryItem, b: InventoryItem) => {
      const s = a.store.name.localeCompare(b.store.name);
      if (s !== 0) return s;
      const p = a.product.name.localeCompare(b.product.name);
      if (p !== 0) return p;
      return a.id.localeCompare(b.id);
    };

    filtered.sort((a, b) => {
      if (!sort) return stableCmp(a, b);

      let cmp = 0;
      if (sort.field === 'STORE_NAME')
        cmp = a.store.name.localeCompare(b.store.name);
      else if (sort.field === 'PRODUCT_NAME')
        cmp = a.product.name.localeCompare(b.product.name);
      else if (sort.field === 'CATEGORY')
        cmp = a.product.category.localeCompare(b.product.category);
      else if (sort.field === 'PRICE') cmp = Number(a.price) - Number(b.price);
      else if (sort.field === 'QUANTITY') cmp = a.quantity - b.quantity;
      else if (sort.field === 'VALUE')
        cmp = Number(a.price) * a.quantity - Number(b.price) * b.quantity;
      else cmp = stableCmp(a, b);

      if (cmp !== 0) return cmp * dir;
      return stableCmp(a, b);
    });

    const total = filtered.length;
    const items = filtered.slice(offset, offset + safePageSize);

    return { items, total, page: safePage, pageSize: safePageSize };
  }

  async deleteInventoryItem(input: {
    storeId: string;
    productId: string;
  }): Promise<boolean> {
    const key = `${input.storeId}:${input.productId}`;
    return this.db.inventoryByStoreProduct.delete(key);
  }

  async upsertInventoryItem(input: {
    storeId: string;
    productId: string;
    price: string;
    quantity: number;
  }): Promise<InventoryItem | null> {
    const store = this.db.stores.get(input.storeId);
    if (!store) return null;
    const product = this.db.products.get(input.productId);
    if (!product) return null;

    const key = `${store.id}:${product.id}`;
    const existing = this.db.inventoryByStoreProduct.get(key);
    const now = new Date();

    if (!existing) {
      const ii = new InventoryItem(
        newId(),
        store,
        product,
        input.price,
        input.quantity,
        now,
        now,
      );
      this.db.inventoryByStoreProduct.set(key, ii);
      return ii;
    }

    // Domain model has readonly updatedAt, so replace the instance.
    const updated = new InventoryItem(
      existing.id,
      store,
      product,
      input.price,
      input.quantity,
      existing.createdAt,
      now,
    );
    this.db.inventoryByStoreProduct.set(key, updated);
    return updated;
  }

  async storeInventorySummary(
    storeId: string,
  ): Promise<StoreInventorySummary | null> {
    const store = this.db.stores.get(storeId);
    if (!store) return null;

    const items = [...this.db.inventoryByStoreProduct.values()].filter(
      (ii) => ii.store.id === storeId,
    );

    const totalSkus = items.length;
    const totalQuantity = items.reduce((sum, ii) => sum + ii.quantity, 0);
    const totalValueN = items.reduce(
      (sum, ii) => sum + Number(ii.price) * ii.quantity,
      0,
    );
    const lowStockCount = items.reduce(
      (sum, ii) => sum + (ii.quantity <= 5 ? 1 : 0),
      0,
    );

    return {
      store,
      totalSkus,
      totalQuantity,
      totalValue: asMoneyString(totalValueN),
      lowStockCount,
    };
  }
}
