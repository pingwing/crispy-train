import type {
  InventoryItem as InventoryItemEntity,
  Product as ProductEntity,
  Store as StoreEntity,
} from '../db/entities';
import { InventoryItem, Product, Store } from '../domain';

export function toDomainStore(s: StoreEntity): Store {
  return new Store(s.id, s.name, s.location, s.createdAt, s.updatedAt);
}

export function toDomainProduct(p: ProductEntity): Product {
  return new Product(p.id, p.name, p.category, p.createdAt, p.updatedAt);
}

export function toDomainInventoryItem(ii: InventoryItemEntity): InventoryItem {
  // expects relations populated
  const store = toDomainStore(ii.store);
  const product = toDomainProduct(ii.product);
  return new InventoryItem(
    ii.id,
    store,
    product,
    ii.price,
    ii.quantity,
    ii.createdAt,
    ii.updatedAt,
  );
}
