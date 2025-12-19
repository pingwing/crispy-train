// Tests run against compiled output to keep runtime simple (no TS test runner needed).
const {
  createMemoryDb,
  MemoryStoreRepository,
  MemoryProductRepository,
  MemoryInventoryRepository,
} = require('../dist/repositories/testing');
const { InventoryService } = require('../dist/services/InventoryService');

/**
 * @param {Parameters<typeof createMemoryDb>[0]} [seed]
 */
function createTestServices(seed) {
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

module.exports = { createTestServices };


