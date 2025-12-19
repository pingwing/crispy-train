import test from 'node:test';
import assert from 'node:assert/strict';

import { InventoryService } from '../src/services/InventoryService';
import type { IInventoryRepository } from '../src/repositories/InventoryRepository';
import type { IProductRepository } from '../src/repositories/ProductRepository';
import type { IStoreRepository } from '../src/repositories/StoreRepository';
import { InventoryItem, Product, Store } from '../src/domain';
import { NotFoundError, ValidationError } from '../src/domain/errors';

function createAsyncSpy<TArgs extends unknown[], TResult>(
  impl: (...args: TArgs) => Promise<TResult> | TResult,
) {
  const calls: TArgs[] = [];
  const fn = (async (...args: TArgs) => {
    calls.push(args);
    return await impl(...args);
  }) as ((...args: TArgs) => Promise<TResult>) & { calls: TArgs[] };
  fn.calls = calls;
  return fn;
}

const d = new Date('2020-01-01T00:00:00.000Z');
const STORE_ID = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';

function createStore(id = 's1') {
  return new Store(id, 'Store', 'Loc', d, d);
}

function createProduct(id = 'p1') {
  return new Product(id, 'Prod', 'Cat', d, d);
}

function createItem(store = createStore(), product = createProduct()) {
  return new InventoryItem('ii1', store, product, '12.50', 2, d, d);
}

test('listStores delegates to stores.list', async () => {
  const list = createAsyncSpy(async () => [createStore('s1')]);
  const service = new InventoryService(
    { list } as unknown as IStoreRepository,
    {} as IProductRepository,
    {} as IInventoryRepository,
  );

  const result = await service.listStores();
  assert.deepEqual(result, [createStore('s1')]);
  assert.deepEqual(list.calls, [[]]);
});

test('getStore delegates to stores.getById', async () => {
  const getById = createAsyncSpy(async (id: string) =>
    id === 's1' ? createStore('s1') : null,
  );
  const service = new InventoryService(
    { getById } as unknown as IStoreRepository,
    {} as IProductRepository,
    {} as IInventoryRepository,
  );

  const result = await service.getStore('s1');
  assert.equal(result?.id, 's1');
  assert.deepEqual(getById.calls, [['s1']]);
});

test('listInventoryItems clamps page/pageSize and defaults filter to {}', async () => {
  const listInventoryItems = createAsyncSpy(async () => ({
    items: [createItem()],
    total: 1,
    page: 1,
    pageSize: 100,
  }));
  const service = new InventoryService(
    {} as IStoreRepository,
    {} as IProductRepository,
    { listInventoryItems } as unknown as IInventoryRepository,
  );

  await service.listInventoryItems({
    page: 0,
    pageSize: 9999,
    sort: { field: 'PRICE', direction: 'DESC' },
  });

  assert.deepEqual(listInventoryItems.calls, [
    [{}, 1, 100, { field: 'PRICE', direction: 'DESC' }],
  ]);
});

test('getStoreInventorySummary throws NotFoundError when repository returns null', async () => {
  const storeInventorySummary = createAsyncSpy(async () => null);
  const service = new InventoryService(
    {} as IStoreRepository,
    {} as IProductRepository,
    { storeInventorySummary } as unknown as IInventoryRepository,
  );

  await assert.rejects(
    () => service.getStoreInventorySummary('s1'),
    (err: any) => {
      assert.ok(err instanceof NotFoundError);
      assert.equal(err.message, 'Store not found');
      return true;
    },
  );
});

test('createStore trims inputs and delegates to stores.create', async () => {
  const create = createAsyncSpy(async (input: any) => {
    assert.deepEqual(input, { name: 'Main Store', location: 'NYC' });
    return createStore('s1');
  });
  const service = new InventoryService(
    { create } as unknown as IStoreRepository,
    {} as IProductRepository,
    {} as IInventoryRepository,
  );

  const result = await service.createStore({
    name: '  Main Store  ',
    location: '  NYC  ',
  });
  assert.equal(result.id, 's1');
  assert.equal(create.calls.length, 1);
});

test('updateStore throws NotFoundError when stores.update returns null', async () => {
  const update = createAsyncSpy(async () => null);
  const service = new InventoryService(
    { update } as unknown as IStoreRepository,
    {} as IProductRepository,
    {} as IInventoryRepository,
  );

  await assert.rejects(
    () => service.updateStore('s1', { name: 'X' }),
    (err: any) => {
      assert.ok(err instanceof NotFoundError);
      assert.equal(err.message, 'Store not found');
      return true;
    },
  );
});

test('updateStore trims optional fields and preserves explicit null location', async () => {
  const update = createAsyncSpy(async (_id: string, input: any) => {
    assert.deepEqual(input, { name: 'New Name', location: null });
    return createStore('s1');
  });
  const service = new InventoryService(
    { update } as unknown as IStoreRepository,
    {} as IProductRepository,
    {} as IInventoryRepository,
  );

  await service.updateStore('s1', { name: '  New Name  ', location: null });
  assert.deepEqual(update.calls, [
    ['s1', { name: 'New Name', location: null }],
  ]);
});

test('createProduct trims inputs and delegates to products.create', async () => {
  const create = createAsyncSpy(async (input: any) => {
    assert.deepEqual(input, { name: 'Widget', category: 'Gadgets' });
    return createProduct('p1');
  });
  const service = new InventoryService(
    {} as IStoreRepository,
    { create } as unknown as IProductRepository,
    {} as IInventoryRepository,
  );

  const result = await service.createProduct({
    name: '  Widget ',
    category: '  Gadgets  ',
  });
  assert.equal(result.id, 'p1');
  assert.equal(create.calls.length, 1);
});

test('updateProduct throws NotFoundError when products.update returns null', async () => {
  const update = createAsyncSpy(async () => null);
  const service = new InventoryService(
    {} as IStoreRepository,
    { update } as unknown as IProductRepository,
    {} as IInventoryRepository,
  );

  await assert.rejects(
    () => service.updateProduct('p1', { name: 'X' }),
    (err: any) => {
      assert.ok(err instanceof NotFoundError);
      assert.equal(err.message, 'Product not found');
      return true;
    },
  );
});

test('upsertInventoryItem checks store/product existence and delegates to inventory.upsertInventoryItem', async () => {
  const getStoreEntityById = createAsyncSpy(async (_id: string) => ({}) as any);
  const getProductEntityById = createAsyncSpy(
    async (_id: string) => ({}) as any,
  );
  const upsert = createAsyncSpy(async (input: any) => {
    assert.deepEqual(input, {
      storeId: STORE_ID,
      productId: PRODUCT_ID,
      price: '12.50',
      quantity: 3,
    });
    return createItem();
  });

  const service = new InventoryService(
    { getEntityById: getStoreEntityById } as unknown as IStoreRepository,
    { getEntityById: getProductEntityById } as unknown as IProductRepository,
    { upsertInventoryItem: upsert } as unknown as IInventoryRepository,
  );

  const result = await service.upsertInventoryItem({
    storeId: STORE_ID,
    productId: PRODUCT_ID,
    price: '12.50',
    quantity: 3,
  });
  assert.equal(result.quantity, 2); // from createItem()
  assert.deepEqual(getStoreEntityById.calls, [[STORE_ID]]);
  assert.deepEqual(getProductEntityById.calls, [[PRODUCT_ID]]);
  assert.equal(upsert.calls.length, 1);
});

test('upsertInventoryItem throws NotFoundError when store is missing', async () => {
  const getStoreEntityById = createAsyncSpy(async () => null);
  const service = new InventoryService(
    { getEntityById: getStoreEntityById } as unknown as IStoreRepository,
    { getEntityById: async () => ({}) as any } as unknown as IProductRepository,
    {
      upsertInventoryItem: async () => createItem(),
    } as unknown as IInventoryRepository,
  );

  await assert.rejects(
    () =>
      service.upsertInventoryItem({
        storeId: STORE_ID,
        productId: PRODUCT_ID,
        price: '12.50',
        quantity: 3,
      }),
    (err: any) => {
      assert.ok(err instanceof NotFoundError);
      assert.equal(err.message, 'Store not found');
      return true;
    },
  );
});

test('upsertInventoryItem throws NotFoundError when product is missing', async () => {
  const getProductEntityById = createAsyncSpy(async () => null);
  const service = new InventoryService(
    { getEntityById: async () => ({}) as any } as unknown as IStoreRepository,
    { getEntityById: getProductEntityById } as unknown as IProductRepository,
    {
      upsertInventoryItem: async () => createItem(),
    } as unknown as IInventoryRepository,
  );

  await assert.rejects(
    () =>
      service.upsertInventoryItem({
        storeId: STORE_ID,
        productId: PRODUCT_ID,
        price: '12.50',
        quantity: 3,
      }),
    (err: any) => {
      assert.ok(err instanceof NotFoundError);
      assert.equal(err.message, 'Product not found');
      return true;
    },
  );
});

test('upsertInventoryItem throws ValidationError when inventory.upsertInventoryItem returns null', async () => {
  const service = new InventoryService(
    { getEntityById: async () => ({}) as any } as unknown as IStoreRepository,
    { getEntityById: async () => ({}) as any } as unknown as IProductRepository,
    {
      upsertInventoryItem: async () => null,
    } as unknown as IInventoryRepository,
  );

  await assert.rejects(
    () =>
      service.upsertInventoryItem({
        storeId: STORE_ID,
        productId: PRODUCT_ID,
        price: '12.50',
        quantity: 3,
      }),
    (err: any) => {
      assert.ok(err instanceof ValidationError);
      assert.equal(err.message, 'Could not upsert inventory item');
      return true;
    },
  );
});

test('deleteInventoryItem throws NotFoundError when repository returns false', async () => {
  const deleteInventoryItem = createAsyncSpy(async () => false);
  const service = new InventoryService(
    {} as IStoreRepository,
    {} as IProductRepository,
    { deleteInventoryItem } as unknown as IInventoryRepository,
  );

  await assert.rejects(
    () =>
      service.deleteInventoryItem({
        storeId: STORE_ID,
        productId: PRODUCT_ID,
      }),
    (err: any) => {
      assert.ok(err instanceof NotFoundError);
      assert.equal(err.message, 'Inventory item not found');
      return true;
    },
  );
});

test('deleteInventoryItem returns true when repository returns true', async () => {
  const deleteInventoryItem = createAsyncSpy(async (input: any) => {
    assert.deepEqual(input, {
      storeId: STORE_ID,
      productId: PRODUCT_ID,
    });
    return true;
  });
  const service = new InventoryService(
    {} as IStoreRepository,
    {} as IProductRepository,
    { deleteInventoryItem } as unknown as IInventoryRepository,
  );

  const result = await service.deleteInventoryItem({
    storeId: STORE_ID,
    productId: PRODUCT_ID,
  });
  assert.equal(result, true);
  assert.equal(deleteInventoryItem.calls.length, 1);
});
