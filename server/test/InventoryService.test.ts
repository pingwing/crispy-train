import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestServices } from './createTestServices';

test('InventoryService can create stores/products and upsert inventory items (in-memory repos)', async () => {
  const { inventoryService } = createTestServices();

  const store = await inventoryService.createStore({
    name: 'Main Store',
    location: 'NYC',
  });
  const product = await inventoryService.createProduct({
    name: 'Widget',
    category: 'Gadgets',
  });

  const item = await inventoryService.upsertInventoryItem({
    storeId: store.id,
    productId: product.id,
    price: '12.50',
    quantity: 3,
  });

  assert.equal(item.store.id, store.id);
  assert.equal(item.product.id, product.id);
  assert.equal(item.price, '12.50');
  assert.equal(item.quantity, 3);
  assert.equal(item.inventoryValue, '37.50');
});

test('InventoryService enforces unique store name (in-memory repos)', async () => {
  const { inventoryService } = createTestServices();

  await inventoryService.createStore({ name: 'Unique', location: null });

  await assert.rejects(
    () => inventoryService.createStore({ name: 'Unique', location: null }),
    (err: any) => {
      assert.equal(err?.name, 'ValidationError');
      return true;
    },
  );
});

test('InventoryService enforces product name uniqueness within a store (in-memory repos)', async () => {
  const { inventoryService } = createTestServices();

  const s1 = await inventoryService.createStore({ name: 'S1', location: null });
  const s2 = await inventoryService.createStore({ name: 'S2', location: null });

  // Products are global, so duplicates can exist.
  const p1 = await inventoryService.createProduct({
    name: 'Cola',
    category: 'Drinks',
  });
  const p2 = await inventoryService.createProduct({
    name: 'Cola',
    category: 'Other',
  });

  await inventoryService.upsertInventoryItem({
    storeId: s1.id,
    productId: p1.id,
    price: '1.00',
    quantity: 1,
  });

  await assert.rejects(
    () =>
      inventoryService.upsertInventoryItem({
        storeId: s1.id,
        productId: p2.id,
        price: '2.00',
        quantity: 1,
      }),
    (err: any) => {
      assert.equal(err?.name, 'ValidationError');
      assert.equal(err?.message, 'Product name must be unique in this store');
      return true;
    },
  );

  // Same name is allowed in another store.
  await inventoryService.upsertInventoryItem({
    storeId: s2.id,
    productId: p2.id,
    price: '2.00',
    quantity: 1,
  });
});

test('InventoryService prevents renaming a product to a name that would conflict within a store', async () => {
  const { inventoryService } = createTestServices();

  const s1 = await inventoryService.createStore({ name: 'S1', location: null });

  const p1 = await inventoryService.createProduct({ name: 'Cola', category: 'Drinks' });
  const p2 = await inventoryService.createProduct({ name: 'Water', category: 'Drinks' });

  await inventoryService.upsertInventoryItem({
    storeId: s1.id,
    productId: p1.id,
    price: '1.00',
    quantity: 1,
  });
  await inventoryService.upsertInventoryItem({
    storeId: s1.id,
    productId: p2.id,
    price: '1.00',
    quantity: 1,
  });

  await assert.rejects(
    () => inventoryService.updateProduct(p2.id, { name: 'Cola' }),
    (err: any) => {
      assert.equal(err?.name, 'ValidationError');
      assert.equal(err?.message, 'Product name must be unique in this store');
      return true;
    },
  );
});
