import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withProviders } from './_providers';

withProviders((providerName, getProvider) => {
  describe(`ProductRepository contract (${providerName})`, () => {
    it('create + getById returns created product', async () => {
      const { products } = await getProvider();
      const created = await products.create({
        name: 'Cola',
        category: 'Drinks',
      });
      const fetched = await products.getById(created.id);
      assert.ok(fetched);
      assert.equal(fetched?.id, created.id);
      assert.equal(fetched?.name, 'Cola');
      assert.equal(fetched?.category, 'Drinks');
    });

    it('getById returns null for unknown product', async () => {
      const { products } = await getProvider();
      const fetched = await products.getById(
        '00000000-0000-0000-0000-000000000000',
      );
      assert.equal(fetched, null);
    });

    it('update returns null for unknown product', async () => {
      const { products } = await getProvider();
      const updated = await products.update(
        '00000000-0000-0000-0000-000000000000',
        { name: 'X' },
      );
      assert.equal(updated, null);
    });

    it('update changes fields', async () => {
      const { products } = await getProvider();
      const p = await products.create({ name: 'Old', category: 'A' });
      const updated = await products.update(p.id, {
        name: 'New',
        category: 'B',
      });
      assert.ok(updated);
      assert.equal(updated?.name, 'New');
      assert.equal(updated?.category, 'B');
    });
  });
});
