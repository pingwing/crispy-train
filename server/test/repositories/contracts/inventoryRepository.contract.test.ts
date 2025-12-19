import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withProviders } from './_providers';
import type { InventoryItemSort } from '../../../src/repositories/InventoryRepository';

const MISSING_UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

withProviders((providerName, getProvider) => {
  describe(`InventoryRepository contract (${providerName})`, () => {
    it('upsert creates, then upsert on same (store,product) updates', async () => {
      const { stores, products, inventory } = await getProvider();
      const s = await stores.create({ name: 'S' });
      const p = await products.create({ name: 'P', category: 'C' });

      const first = await inventory.upsertInventoryItem({
        storeId: s.id,
        productId: p.id,
        price: '1.00',
        quantity: 1,
      });
      assert.ok(first);
      assert.equal(first?.price, '1.00');
      assert.equal(first?.quantity, 1);

      const second = await inventory.upsertInventoryItem({
        storeId: s.id,
        productId: p.id,
        price: '2.50',
        quantity: 3,
      });
      assert.ok(second);
      assert.equal(second?.id, first?.id);
      assert.equal(second?.price, '2.50');
      assert.equal(second?.quantity, 3);
    });

    it('deleteInventoryItem removes the item and returns true; returns false when missing', async () => {
      const { stores, products, inventory } = await getProvider();
      const s = await stores.create({ name: 'S' });
      const p = await products.create({ name: 'P', category: 'C' });

      await inventory.upsertInventoryItem({
        storeId: s.id,
        productId: p.id,
        price: '1.00',
        quantity: 1,
      });
      const deleted = await inventory.deleteInventoryItem({
        storeId: s.id,
        productId: p.id,
      });
      assert.equal(deleted, true);

      const deletedAgain = await inventory.deleteInventoryItem({
        storeId: s.id,
        productId: p.id,
      });
      assert.equal(deletedAgain, false);
    });

    it('filters: category is case-insensitive substring match', async () => {
      const { stores, products, inventory } = await getProvider();
      const s = await stores.create({ name: 'S' });
      const p1 = await products.create({ name: 'P1', category: 'Soft Drinks' });
      const p2 = await products.create({ name: 'P2', category: 'Snacks' });

      await inventory.upsertInventoryItem({
        storeId: s.id,
        productId: p1.id,
        price: '1.00',
        quantity: 1,
      });
      await inventory.upsertInventoryItem({
        storeId: s.id,
        productId: p2.id,
        price: '1.00',
        quantity: 1,
      });

      const res = await inventory.listInventoryItems(
        { category: 'drin' },
        1,
        50,
      );
      assert.deepEqual(
        res.items.map((ii) => ii.product.id),
        [p1.id],
      );
    });

    it('sort: can sort by QUANTITY desc (stable tie-breaker)', async () => {
      const { stores, products, inventory } = await getProvider();
      const s = await stores.create({ name: 'S' });
      const p1 = await products.create({ name: 'A', category: 'C' });
      const p2 = await products.create({ name: 'B', category: 'C' });

      await inventory.upsertInventoryItem({
        storeId: s.id,
        productId: p1.id,
        price: '1.00',
        quantity: 1,
      });
      await inventory.upsertInventoryItem({
        storeId: s.id,
        productId: p2.id,
        price: '1.00',
        quantity: 10,
      });

      const sort: InventoryItemSort = { field: 'QUANTITY', direction: 'DESC' };
      const res = await inventory.listInventoryItems(
        { storeId: s.id },
        1,
        50,
        sort,
      );
      assert.deepEqual(
        res.items.map((ii) => ii.product.name),
        ['B', 'A'],
      );
    });

    it('filters: search matches product name or store name (case-insensitive)', async () => {
      const { stores, products, inventory } = await getProvider();
      const s1 = await stores.create({ name: 'Alpha Shop' });
      const s2 = await stores.create({ name: 'Beta Shop' });
      const p1 = await products.create({
        name: 'Super Widget',
        category: 'Tools',
      });
      const p2 = await products.create({ name: 'Chips', category: 'Snacks' });

      await inventory.upsertInventoryItem({
        storeId: s1.id,
        productId: p1.id,
        price: '1.00',
        quantity: 1,
      });
      await inventory.upsertInventoryItem({
        storeId: s2.id,
        productId: p2.id,
        price: '1.00',
        quantity: 1,
      });

      const byProduct = await inventory.listInventoryItems(
        { search: 'wIdGeT' },
        1,
        50,
      );
      assert.deepEqual(
        byProduct.items.map((ii) => ii.product.id),
        [p1.id],
      );

      const byStore = await inventory.listInventoryItems(
        { search: 'ALPHA' },
        1,
        50,
      );
      assert.deepEqual(
        byStore.items.map((ii) => ii.store.id),
        [s1.id],
      );
    });

    it('filters: min/max price and min/max quantity work together', async () => {
      const { stores, products, inventory } = await getProvider();
      const s = await stores.create({ name: 'S' });
      const p1 = await products.create({ name: 'P1', category: 'C' });
      const p2 = await products.create({ name: 'P2', category: 'C' });
      const p3 = await products.create({ name: 'P3', category: 'C' });

      await inventory.upsertInventoryItem({
        storeId: s.id,
        productId: p1.id,
        price: '1.99',
        quantity: 2,
      }); // too cheap
      await inventory.upsertInventoryItem({
        storeId: s.id,
        productId: p2.id,
        price: '2.50',
        quantity: 3,
      }); // should match
      await inventory.upsertInventoryItem({
        storeId: s.id,
        productId: p3.id,
        price: '3.01',
        quantity: 4,
      }); // too expensive

      const res = await inventory.listInventoryItems(
        {
          storeId: s.id,
          minPrice: '2.00',
          maxPrice: '3.00',
          minQuantity: 3,
          maxQuantity: 3,
        },
        1,
        50,
      );
      assert.deepEqual(
        res.items.map((ii) => ii.product.id),
        [p2.id],
      );
    });

    it('default sort is stable (store name asc, product name asc)', async () => {
      const { stores, products, inventory } = await getProvider();
      const sA = await stores.create({ name: 'A Store' });
      const sB = await stores.create({ name: 'B Store' });
      const pA = await products.create({ name: 'A Product', category: 'C' });
      const pB = await products.create({ name: 'B Product', category: 'C' });

      // Insert in non-sorted order intentionally.
      await inventory.upsertInventoryItem({
        storeId: sB.id,
        productId: pB.id,
        price: '1.00',
        quantity: 1,
      });
      await inventory.upsertInventoryItem({
        storeId: sA.id,
        productId: pB.id,
        price: '1.00',
        quantity: 1,
      });
      await inventory.upsertInventoryItem({
        storeId: sA.id,
        productId: pA.id,
        price: '1.00',
        quantity: 1,
      });

      const res = await inventory.listInventoryItems({}, 1, 50);
      assert.deepEqual(
        res.items.map((ii) => `${ii.store.name}:${ii.product.name}`),
        ['A Store:A Product', 'A Store:B Product', 'B Store:B Product'],
      );
    });

    it('sort: supports STORE_NAME, PRODUCT_NAME, CATEGORY, PRICE, VALUE (asc/desc)', async () => {
      const { stores, products, inventory } = await getProvider();
      const sA = await stores.create({ name: 'A Store' });
      const sB = await stores.create({ name: 'B Store' });
      const pA = await products.create({
        name: 'A Product',
        category: 'Alpha',
      });
      const pB = await products.create({ name: 'B Product', category: 'Beta' });

      // Values:
      // A/A: 2.00 * 2 = 4.00
      // B/B: 1.00 * 10 = 10.00
      await inventory.upsertInventoryItem({
        storeId: sB.id,
        productId: pB.id,
        price: '1.00',
        quantity: 10,
      });
      await inventory.upsertInventoryItem({
        storeId: sA.id,
        productId: pA.id,
        price: '2.00',
        quantity: 2,
      });

      const byStoreAsc = await inventory.listInventoryItems({}, 1, 50, {
        field: 'STORE_NAME',
        direction: 'ASC',
      });
      assert.deepEqual(
        byStoreAsc.items.map((ii) => ii.store.name),
        ['A Store', 'B Store'],
      );

      const byProductDesc = await inventory.listInventoryItems({}, 1, 50, {
        field: 'PRODUCT_NAME',
        direction: 'DESC',
      });
      assert.deepEqual(
        byProductDesc.items.map((ii) => ii.product.name),
        ['B Product', 'A Product'],
      );

      const byCategoryAsc = await inventory.listInventoryItems({}, 1, 50, {
        field: 'CATEGORY',
        direction: 'ASC',
      });
      assert.deepEqual(
        byCategoryAsc.items.map((ii) => ii.product.category),
        ['Alpha', 'Beta'],
      );

      const byPriceAsc = await inventory.listInventoryItems({}, 1, 50, {
        field: 'PRICE',
        direction: 'ASC',
      });
      assert.deepEqual(
        byPriceAsc.items.map((ii) => ii.price),
        ['1.00', '2.00'],
      );

      const byValueDesc = await inventory.listInventoryItems({}, 1, 50, {
        field: 'VALUE',
        direction: 'DESC',
      });
      assert.deepEqual(
        byValueDesc.items.map((ii) => `${ii.store.name}:${ii.product.name}`),
        ['B Store:B Product', 'A Store:A Product'],
      );
    });

    it('sort: unknown field falls back to stable ordering', async () => {
      const { stores, products, inventory } = await getProvider();
      const sA = await stores.create({ name: 'A Store' });
      const sB = await stores.create({ name: 'B Store' });
      const pA = await products.create({ name: 'A Product', category: 'C' });
      const pB = await products.create({ name: 'B Product', category: 'C' });

      await inventory.upsertInventoryItem({
        storeId: sB.id,
        productId: pB.id,
        price: '1.00',
        quantity: 1,
      });
      await inventory.upsertInventoryItem({
        storeId: sA.id,
        productId: pA.id,
        price: '1.00',
        quantity: 1,
      });

      const res = await inventory.listInventoryItems(
        {},
        1,
        50,
        // Use ASC so both implementations (memory and db) agree on expected stable ordering.
        { field: 'BOGUS', direction: 'ASC' } as any,
      );
      assert.deepEqual(
        res.items.map((ii) => `${ii.store.name}:${ii.product.name}`),
        ['A Store:A Product', 'B Store:B Product'],
      );
    });

    it('storeInventorySummary aggregates totals and lowStockCount; returns null for missing store', async () => {
      const { stores, products, inventory } = await getProvider();
      const s1 = await stores.create({ name: 'S1' });
      const s2 = await stores.create({ name: 'S2' });
      const p1 = await products.create({ name: 'P1', category: 'C' });
      const p2 = await products.create({ name: 'P2', category: 'C' });

      await inventory.upsertInventoryItem({
        storeId: s1.id,
        productId: p1.id,
        price: '2.00',
        quantity: 5, // low stock
      });
      await inventory.upsertInventoryItem({
        storeId: s1.id,
        productId: p2.id,
        price: '1.50',
        quantity: 6,
      });
      // Different store should not be included in summary.
      await inventory.upsertInventoryItem({
        storeId: s2.id,
        productId: p1.id,
        price: '100.00',
        quantity: 1,
      });

      const summary = await inventory.storeInventorySummary(s1.id);
      assert.ok(summary);
      assert.equal(summary?.store.id, s1.id);
      assert.equal(summary?.totalSkus, 2);
      assert.equal(summary?.totalQuantity, 11);
      assert.equal(summary?.totalValue, '19.00'); // 2.00*5 + 1.50*6
      assert.equal(summary?.lowStockCount, 1);

      const missing = await inventory.storeInventorySummary(MISSING_UUID);
      assert.equal(missing, null);
    });

    it('storeInventorySummary returns zeros for an existing store with no items', async () => {
      const { stores, inventory } = await getProvider();
      const s = await stores.create({ name: 'Empty Store' });

      const summary = await inventory.storeInventorySummary(s.id);
      assert.ok(summary);
      assert.equal(summary?.store.id, s.id);
      assert.equal(summary?.totalSkus, 0);
      assert.equal(summary?.totalQuantity, 0);
      assert.equal(summary?.totalValue, '0.00');
      assert.equal(summary?.lowStockCount, 0);
    });
  });
});
