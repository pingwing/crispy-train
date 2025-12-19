const test = require("node:test");
const assert = require("node:assert/strict");

// Tests run against compiled output to keep runtime simple (no TS test runner needed).
const { createTestServices } = require("./createTestServices");

test("InventoryService can create stores/products and upsert inventory items (in-memory repos)", async () => {
  const { inventoryService } = createTestServices();

  const store = await inventoryService.createStore({
    name: "Main Store",
    location: "NYC",
  });
  const product = await inventoryService.createProduct({
    name: "Widget",
    category: "Gadgets",
  });

  const item = await inventoryService.upsertInventoryItem({
    storeId: store.id,
    productId: product.id,
    price: "12.50",
    quantity: 3,
  });

  assert.equal(item.store.id, store.id);
  assert.equal(item.product.id, product.id);
  assert.equal(item.price, "12.50");
  assert.equal(item.quantity, 3);
  assert.equal(item.inventoryValue, "37.50");
});

test("InventoryService enforces unique store name (in-memory repos)", async () => {
  const { inventoryService } = createTestServices();

  await inventoryService.createStore({ name: "Unique", location: null });

  await assert.rejects(
    () => inventoryService.createStore({ name: "Unique", location: null }),
    (err) => {
      assert.equal(err?.name, "ValidationError");
      return true;
    }
  );
});
