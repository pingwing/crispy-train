import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GraphQLError } from 'graphql';
import { resolvers } from '../../src/graphql/resolvers';
import type { GraphQLContext } from '../../src/graphql/types';
import {
  InventoryItemSortField,
  SortDirection,
} from '../../src/graphql/generated/resolvers-types';
import { InventoryItem, Product, Store } from '../../src/domain';
import { NotFoundError, ValidationError } from '../../src/domain/errors';

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

function asResolverFn(resolver: any) {
  return typeof resolver === 'function' ? resolver : resolver.resolve;
}

function createCtx(overrides?: Partial<GraphQLContext>): GraphQLContext {
  return {
    orm: null as any,
    em: null as any,
    req: null as any,
    services: {
      inventoryService: {} as any,
      stores: {} as any,
      products: {} as any,
      inventory: {} as any,
    },
    ...overrides,
  };
}

const d = new Date('2020-01-01T00:00:00.000Z');

test('Query._health returns ok', async () => {
  const ctx = createCtx();
  const result = await asResolverFn(resolvers.Query!._health)(
    {},
    {},
    ctx,
    null as any,
  );
  assert.equal(result, 'ok');
});

test('Query.stores delegates to inventoryService.listStores', async () => {
  const stores = [new Store('s1', 'Store 1', undefined, d, d)];
  const listStores = createAsyncSpy(async () => stores);
  const ctx = createCtx({
    services: {
      ...(createCtx().services as any),
      inventoryService: { listStores },
    },
  } as any);

  const result = await asResolverFn(resolvers.Query!.stores)(
    {},
    {},
    ctx,
    null as any,
  );
  assert.equal(listStores.calls.length, 1);
  assert.deepEqual(result, stores);
});

test('Query.store delegates to inventoryService.getStore', async () => {
  const store = new Store('s1', 'Store 1', 'Warsaw', d, d);
  const getStore = createAsyncSpy(async (id: string) =>
    id === 's1' ? store : null,
  );
  const ctx = createCtx({
    services: {
      ...(createCtx().services as any),
      inventoryService: { getStore },
    },
  } as any);

  const result = await asResolverFn(resolvers.Query!.store)(
    {},
    { id: 's1' },
    ctx,
    null as any,
  );
  assert.deepEqual(getStore.calls, [['s1']]);
  assert.equal(result, store);
});

test('Query.inventoryItems maps filter/sort and returns InventoryItemPage shape', async () => {
  const store = new Store('s1', 'Store 1', undefined, d, d);
  const product = new Product('p1', 'Prod 1', 'Cat 1', d, d);
  const item = new InventoryItem('ii1', store, product, '12.34', 2, d, d);

  const listInventoryItems = createAsyncSpy(
    async (args: {
      filter?: any;
      sort?: any;
      page?: number;
      pageSize?: number;
    }) => {
      assert.deepEqual(args, {
        filter: {
          storeId: 's1',
          search: 'abc',
          minPrice: '1.00',
          minQuantity: 0,
        },
        sort: { field: 'PRICE', direction: 'DESC' },
        page: 2,
        pageSize: 5,
      });
      return { items: [item], total: 10, page: 2, pageSize: 5 };
    },
  );

  const ctx = createCtx({
    services: {
      ...(createCtx().services as any),
      inventoryService: { listInventoryItems },
    },
  } as any);

  const result = await asResolverFn(resolvers.Query!.inventoryItems)(
    {},
    {
      filter: {
        storeId: 's1',
        category: null,
        search: 'abc',
        minPrice: '1.00',
        maxPrice: null,
        minQuantity: 0,
        maxQuantity: null,
      },
      sort: {
        field: InventoryItemSortField.Price,
        direction: SortDirection.Desc,
      },
      page: 2,
      pageSize: 5,
    },
    ctx,
    null as any,
  );

  assert.equal(listInventoryItems.calls.length, 1);
  assert.deepEqual(result, {
    items: [item],
    pageInfo: { page: 2, pageSize: 5, total: 10 },
  });
});

test('Store.inventoryItems delegates to services.stores.listInventoryItems', async () => {
  const store = new Store('s1', 'Store 1', undefined, d, d);
  const product = new Product('p1', 'Prod 1', 'Cat 1', d, d);
  const items = [new InventoryItem('ii1', store, product, '2.00', 1, d, d)];

  const listInventoryItems = createAsyncSpy(async (storeId: string) => {
    assert.equal(storeId, 's1');
    return items;
  });

  const ctx = createCtx({
    services: {
      ...(createCtx().services as any),
      stores: { listInventoryItems },
    },
  } as any);

  const result = await asResolverFn(resolvers.Store!.inventoryItems)(
    store,
    {},
    ctx,
    null as any,
  );

  assert.deepEqual(listInventoryItems.calls, [['s1']]);
  assert.deepEqual(result, items);
});

test('Mutation.updateStore maps nullable fields before delegating', async () => {
  const updated = new Store('s1', 'New Name', null as any, d, d);
  const updateStore = createAsyncSpy(
    async (id: string, input: { name?: string; location?: string | null }) => {
      assert.equal(id, 's1');
      // name: null should be omitted; location: null should be preserved
      assert.deepEqual(input, { location: null });
      return updated;
    },
  );

  const ctx = createCtx({
    services: {
      ...(createCtx().services as any),
      inventoryService: { updateStore },
    },
  } as any);

  const result = await asResolverFn(resolvers.Mutation!.updateStore)(
    {},
    { id: 's1', input: { name: null, location: null } },
    ctx,
    null as any,
  );

  assert.equal(updateStore.calls.length, 1);
  assert.equal(result, updated);
});

test('Mutation.createStore maps ValidationError to GraphQLError BAD_USER_INPUT', async () => {
  const createStore = createAsyncSpy(async () => {
    throw new ValidationError('bad input', { field: 'name' });
  });
  const ctx = createCtx({
    services: {
      ...(createCtx().services as any),
      inventoryService: { createStore },
    },
  } as any);

  await assert.rejects(
    () =>
      asResolverFn(resolvers.Mutation!.createStore)(
        {},
        { input: { name: 'x', location: null } },
        ctx,
        null as any,
      ),
    (err: any) => {
      assert.ok(err instanceof GraphQLError);
      assert.equal(err.message, 'bad input');
      assert.equal(err.extensions?.code, 'BAD_USER_INPUT');
      assert.deepEqual(err.extensions?.details, { field: 'name' });
      return true;
    },
  );
});

test('Mutation.updateProduct maps NotFoundError to GraphQLError NOT_FOUND', async () => {
  const updateProduct = createAsyncSpy(async () => {
    throw new NotFoundError('Product not found');
  });
  const ctx = createCtx({
    services: {
      ...(createCtx().services as any),
      inventoryService: { updateProduct },
    },
  } as any);

  await assert.rejects(
    () =>
      asResolverFn(resolvers.Mutation!.updateProduct)(
        {},
        { id: 'p1', input: { name: 'x', category: 'c' } },
        ctx,
        null as any,
      ),
    (err: any) => {
      assert.ok(err instanceof GraphQLError);
      assert.equal(err.message, 'Product not found');
      assert.equal(err.extensions?.code, 'NOT_FOUND');
      return true;
    },
  );
});

test('Mutation.deleteInventoryItem maps unknown errors to GraphQLError INTERNAL', async () => {
  const deleteInventoryItem = createAsyncSpy(async () => {
    throw new Error('boom');
  });
  const ctx = createCtx({
    services: {
      ...(createCtx().services as any),
      inventoryService: { deleteInventoryItem },
    },
  } as any);

  await assert.rejects(
    () =>
      asResolverFn(resolvers.Mutation!.deleteInventoryItem)(
        {},
        { storeId: 's1', productId: 'p1' },
        ctx,
        null as any,
      ),
    (err: any) => {
      assert.ok(err instanceof GraphQLError);
      assert.equal(err.message, 'Internal server error');
      assert.equal(err.extensions?.code, 'INTERNAL');
      return true;
    },
  );
});
