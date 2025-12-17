import type { SqlEntityManager } from '@mikro-orm/postgresql';
import { InventoryRepository } from '../repositories/InventoryRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { StoreRepository } from '../repositories/StoreRepository';
import { InventoryService } from './InventoryService';

export type CreateServicesDeps = {
  em: SqlEntityManager;
  StoreRepository: typeof StoreRepository;
  ProductRepository: typeof ProductRepository;
  InventoryRepository: typeof InventoryRepository;
  InventoryService: typeof InventoryService;
};

export function createServices(deps: CreateServicesDeps) {
  const stores = new deps.StoreRepository(deps.em);
  const products = new deps.ProductRepository(deps.em);
  const inventory = new deps.InventoryRepository(deps.em);

  return {
    stores,
    products,
    inventory,
    inventoryService: new deps.InventoryService(stores, products, inventory),
  };
}


