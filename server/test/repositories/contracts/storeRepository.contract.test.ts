import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withProviders } from './_providers';
import { ValidationError } from '../../../src/domain';

withProviders((providerName, getProvider) => {
  describe(`StoreRepository contract (${providerName})`, () => {
    it('create + getById returns created store', async () => {
      const { stores } = await getProvider();
      const created = await stores.create({ name: 'Alpha', location: 'Warsaw' });
      const fetched = await stores.getById(created.id);
      assert.ok(fetched);
      assert.equal(fetched?.id, created.id);
      assert.equal(fetched?.name, 'Alpha');
      assert.equal(fetched?.location, 'Warsaw');
    });

    it('list returns stores sorted by name asc', async () => {
      const { stores } = await getProvider();
      await stores.create({ name: 'Zulu' });
      await stores.create({ name: 'Alpha' });
      await stores.create({ name: 'Mike' });
      const list = await stores.list();
      assert.deepEqual(list.map((s) => s.name), ['Alpha', 'Mike', 'Zulu']);
    });

    it('create enforces unique store name', async () => {
      const { stores } = await getProvider();
      await stores.create({ name: 'Dup' });
      await assert.rejects(() => stores.create({ name: 'Dup' }), (e: any) => {
        assert.ok(e instanceof ValidationError);
        return true;
      });
    });

    it('update returns null for unknown store', async () => {
      const { stores } = await getProvider();
      const res = await stores.update('00000000-0000-0000-0000-000000000000', { name: 'X' });
      assert.equal(res, null);
    });

    it('update can change name and location', async () => {
      const { stores } = await getProvider();
      const s = await stores.create({ name: 'Old', location: 'A' });
      const updated = await stores.update(s.id, { name: 'New', location: null });
      assert.ok(updated);
      assert.equal(updated?.name, 'New');
      assert.equal(updated?.location, undefined);
    });

    it('update enforces unique name', async () => {
      const { stores } = await getProvider();
      const a = await stores.create({ name: 'A' });
      const b = await stores.create({ name: 'B' });
      await assert.rejects(() => stores.update(b.id, { name: a.name }), (e: any) => {
        assert.ok(e instanceof ValidationError);
        return true;
      });
    });

    it('listInventoryItems returns items sorted by product name asc', async () => {
      const { stores, products, inventory } = await getProvider();
      const s = await stores.create({ name: 'S' });
      const p1 = await products.create({ name: 'Banana', category: 'Fruit' });
      const p2 = await products.create({ name: 'Apple', category: 'Fruit' });

      await inventory.upsertInventoryItem({ storeId: s.id, productId: p1.id, price: '1.00', quantity: 1 });
      await inventory.upsertInventoryItem({ storeId: s.id, productId: p2.id, price: '1.00', quantity: 1 });

      const items = await stores.listInventoryItems(s.id);
      assert.deepEqual(items.map((ii) => ii.product.name), ['Apple', 'Banana']);
    });
  });
});


