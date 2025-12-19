import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withProviders } from './_providers';
import type { InventoryItemSort } from '../../../src/repositories/InventoryRepository';

withProviders((providerName, getProvider) => {
  describe(`InventoryRepository contract (${providerName})`, () => {
    it('upsert creates, then upsert on same (store,product) updates', async () => {
      const { stores, products, inventory } = await getProvider();
      const s = await stores.create({ name: 'S' });
      const p = await products.create({ name: 'P', category: 'C' });

      const first = await inventory.upsertInventoryItem({ storeId: s.id, productId: p.id, price: '1.00', quantity: 1 });
      assert.ok(first);
      assert.equal(first?.price, '1.00');
      assert.equal(first?.quantity, 1);

      const second = await inventory.upsertInventoryItem({ storeId: s.id, productId: p.id, price: '2.50', quantity: 3 });
      assert.ok(second);
      assert.equal(second?.id, first?.id);
      assert.equal(second?.price, '2.50');
      assert.equal(second?.quantity, 3);
    });

    it('deleteInventoryItem removes the item and returns true; returns false when missing', async () => {
      const { stores, products, inventory } = await getProvider();
      const s = await stores.create({ name: 'S' });
      const p = await products.create({ name: 'P', category: 'C' });

      await inventory.upsertInventoryItem({ storeId: s.id, productId: p.id, price: '1.00', quantity: 1 });
      const deleted = await inventory.deleteInventoryItem({ storeId: s.id, productId: p.id });
      assert.equal(deleted, true);

      const deletedAgain = await inventory.deleteInventoryItem({ storeId: s.id, productId: p.id });
      assert.equal(deletedAgain, false);
    });

    it('filters: category is case-insensitive substring match', async () => {
      const { stores, products, inventory } = await getProvider();
      const s = await stores.create({ name: 'S' });
      const p1 = await products.create({ name: 'P1', category: 'Soft Drinks' });
      const p2 = await products.create({ name: 'P2', category: 'Snacks' });

      await inventory.upsertInventoryItem({ storeId: s.id, productId: p1.id, price: '1.00', quantity: 1 });
      await inventory.upsertInventoryItem({ storeId: s.id, productId: p2.id, price: '1.00', quantity: 1 });

      const res = await inventory.listInventoryItems({ category: 'drin' }, 1, 50);
      assert.deepEqual(res.items.map((ii) => ii.product.id), [p1.id]);
    });

    it('sort: can sort by QUANTITY desc (stable tie-breaker)', async () => {
      const { stores, products, inventory } = await getProvider();
      const s = await stores.create({ name: 'S' });
      const p1 = await products.create({ name: 'A', category: 'C' });
      const p2 = await products.create({ name: 'B', category: 'C' });

      await inventory.upsertInventoryItem({ storeId: s.id, productId: p1.id, price: '1.00', quantity: 1 });
      await inventory.upsertInventoryItem({ storeId: s.id, productId: p2.id, price: '1.00', quantity: 10 });

      const sort: InventoryItemSort = { field: 'QUANTITY', direction: 'DESC' };
      const res = await inventory.listInventoryItems({ storeId: s.id }, 1, 50, sort);
      assert.deepEqual(res.items.map((ii) => ii.product.name), ['B', 'A']);
    });
  });
});


