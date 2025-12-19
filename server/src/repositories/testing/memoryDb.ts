import type { InventoryItem } from '../../domain/InventoryItem';
import type { Product } from '../../domain/Product';
import type { Store } from '../../domain/Store';

export type MemoryDb = {
  stores: Map<string, Store>;
  products: Map<string, Product>;
  /**
   * Keyed by `${storeId}:${productId}` to enforce the (store, product) uniqueness constraint.
   */
  inventoryByStoreProduct: Map<string, InventoryItem>;
};

export function createMemoryDb(seed?: {
  stores?: Store[];
  products?: Product[];
  inventoryItems?: InventoryItem[];
}): MemoryDb {
  const db: MemoryDb = {
    stores: new Map<string, Store>(),
    products: new Map<string, Product>(),
    inventoryByStoreProduct: new Map<string, InventoryItem>(),
  };

  for (const s of seed?.stores ?? []) db.stores.set(s.id, s);
  for (const p of seed?.products ?? []) db.products.set(p.id, p);
  for (const ii of seed?.inventoryItems ?? []) {
    db.inventoryByStoreProduct.set(`${ii.store.id}:${ii.product.id}`, ii);
  }

  return db;
}
