import {
  createMemoryDb,
  MemoryInventoryRepository,
  MemoryProductRepository,
  MemoryStoreRepository,
} from '../src/repositories/testing';
import { InventoryService } from '../src/services/InventoryService';

export function createTestServices(seed?: Parameters<typeof createMemoryDb>[0]) {
  const db = createMemoryDb(seed);
  const stores = new MemoryStoreRepository(db);
  const products = new MemoryProductRepository(db);
  const inventory = new MemoryInventoryRepository(db);

  return {
    db,
    stores,
    products,
    inventory,
    inventoryService: new InventoryService(stores, products, inventory),
  };
}


