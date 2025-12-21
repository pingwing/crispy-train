import { describe, it } from 'node:test';
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

describe('GraphQL resolvers', () => {
  describe('Scalars', () => {
    it('DateTime scalar serializes Dates to ISO strings', () => {
      const dt = (resolvers as any).DateTime;
      assert.ok(dt);
      assert.equal(dt.serialize(d), '2020-01-01T00:00:00.000Z');
    });
  });

  describe('Query', () => {
    it('_health returns ok', async () => {
      const ctx = createCtx();
      const result = await asResolverFn(resolvers.Query!._health)(
        {},
        {},
        ctx,
        null as any,
      );
      assert.equal(result, 'ok');
    });

    it('stores delegates to inventoryService.listStores', async () => {
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

    it('store delegates to inventoryService.getStore', async () => {
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

    it('inventoryItems maps filter/sort and returns InventoryItemPage shape', async () => {
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

    it('inventoryItems maps all sort fields and defaults direction to ASC; empty filter becomes undefined', async () => {
      const listInventoryItems = createAsyncSpy(async (_args: any) => {
        return { items: [], total: 0, page: 1, pageSize: 20 };
      });

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { listInventoryItems },
        },
      } as any);

      const cases = [
        { gql: InventoryItemSortField.StoreName, repo: 'STORE_NAME' },
        { gql: InventoryItemSortField.ProductName, repo: 'PRODUCT_NAME' },
        { gql: InventoryItemSortField.Category, repo: 'CATEGORY' },
        { gql: InventoryItemSortField.Price, repo: 'PRICE' },
        { gql: InventoryItemSortField.Quantity, repo: 'QUANTITY' },
        { gql: InventoryItemSortField.Value, repo: 'VALUE' },
      ] as const;

      for (const c of cases) {
        await asResolverFn(resolvers.Query!.inventoryItems)(
          {},
          {
            filter: {
              storeId: null,
              category: null,
              search: null,
              minPrice: null,
              maxPrice: null,
              minQuantity: null,
              maxQuantity: null,
            },
            sort: { field: c.gql },
            page: 1,
            pageSize: 20,
          },
          ctx,
          null as any,
        );

        const lastCall = listInventoryItems.calls.at(-1);
        assert.ok(lastCall);
        const [lastArgs] = lastCall;
        assert.equal(lastArgs.filter, undefined);
        assert.deepEqual(lastArgs.sort, { field: c.repo, direction: 'ASC' });
      }
    });

    it('storeInventorySummary delegates to inventoryService.getStoreInventorySummary', async () => {
      const store = new Store('s1', 'Store 1', undefined, d, d);
      const summary = {
        store,
        totalSkus: 2,
        totalQuantity: 11,
        totalValue: '19.00',
        lowStockCount: 1,
      };

      const getStoreInventorySummary = createAsyncSpy(
        async (storeId: string) => {
          assert.equal(storeId, 's1');
          return summary;
        },
      );

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { getStoreInventorySummary },
        },
      } as any);

      const result = await asResolverFn(resolvers.Query!.storeInventorySummary)(
        {},
        { storeId: 's1' },
        ctx,
        null as any,
      );

      assert.deepEqual(getStoreInventorySummary.calls, [['s1']]);
      assert.deepEqual(result, summary);
    });

    it('inventoryItems omits filter/sort/page/pageSize when not provided', async () => {
      const listInventoryItems = createAsyncSpy(async (args: any) => {
        assert.deepEqual(args, {
          filter: undefined,
          sort: undefined,
          page: undefined,
          pageSize: undefined,
        });
        return { items: [], total: 0, page: 1, pageSize: 20 };
      });

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { listInventoryItems },
        },
      } as any);

      await asResolverFn(resolvers.Query!.inventoryItems)(
        {},
        {},
        ctx,
        null as any,
      );

      assert.equal(listInventoryItems.calls.length, 1);
    });

    it('storeInventorySummary maps NotFoundError to GraphQLError NOT_FOUND', async () => {
      const getStoreInventorySummary = createAsyncSpy(async () => {
        throw new NotFoundError('Store not found');
      });

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { getStoreInventorySummary },
        },
      } as any);

      await assert.rejects(
        () =>
          asResolverFn(resolvers.Query!.storeInventorySummary)(
            {},
            { storeId: 's1' },
            ctx,
            null as any,
          ),
        (err: any) => {
          assert.ok(err instanceof GraphQLError);
          assert.equal(err.message, 'Store not found');
          assert.equal(err.extensions?.code, 'NOT_FOUND');
          return true;
        },
      );
    });

    it('inventoryItems maps invalid filter to GraphQLError BAD_USER_INPUT', async () => {
      const listInventoryItems = createAsyncSpy(async () => {
        throw new ValidationError('Invalid filter', {
          issues: [{ code: 'custom', message: 'bad filter', path: ['minPrice'] }],
        });
      });

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { listInventoryItems },
        },
      } as any);

      await assert.rejects(
        () =>
          asResolverFn(resolvers.Query!.inventoryItems)(
            {},
            {
              filter: { minPrice: 'not-a-number' },
              page: 1,
              pageSize: 20,
            },
            ctx,
            null as any,
          ),
        (err: any) => {
          assert.ok(err instanceof GraphQLError);
          assert.equal(err.extensions?.code, 'BAD_USER_INPUT');
          return true;
        },
      );
    });
  });

  describe('Store', () => {
    it('inventoryItems delegates to services.stores.listInventoryItems', async () => {
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
  });

  describe('Mutation', () => {
    it('updateStore maps nullable fields before delegating', async () => {
      const updated = new Store('s1', 'New Name', null as any, d, d);
      const updateStore = createAsyncSpy(
        async (
          id: string,
          input: { name?: string; location?: string | null },
        ) => {
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

    it('updateStore maps unknown errors to GraphQLError INTERNAL', async () => {
      const updateStore = createAsyncSpy(async () => {
        throw new Error('boom');
      });

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { updateStore },
        },
      } as any);

      await assert.rejects(
        () =>
          asResolverFn(resolvers.Mutation!.updateStore)(
            {},
            { id: 's1', input: { name: 'x', location: null } },
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

    it('createProduct delegates to inventoryService.createProduct', async () => {
      const product = new Product('p1', 'Widget', 'Gadgets', d, d);
      const createProduct = createAsyncSpy(async (input: any) => {
        assert.deepEqual(input, { name: 'Widget', category: 'Gadgets' });
        return product;
      });

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { createProduct },
        },
      } as any);

      const result = await asResolverFn(resolvers.Mutation!.createProduct)(
        {},
        { input: { name: 'Widget', category: 'Gadgets' } },
        ctx,
        null as any,
      );

      assert.equal(createProduct.calls.length, 1);
      assert.equal(result, product);
    });

    it('createProduct maps ValidationError to GraphQLError BAD_USER_INPUT', async () => {
      const createProduct = createAsyncSpy(async () => {
        throw new ValidationError('bad product', { field: 'name' });
      });

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { createProduct },
        },
      } as any);

      await assert.rejects(
        () =>
          asResolverFn(resolvers.Mutation!.createProduct)(
            {},
            { input: { name: 'x', category: 'c' } },
            ctx,
            null as any,
          ),
        (err: any) => {
          assert.ok(err instanceof GraphQLError);
          assert.equal(err.message, 'bad product');
          assert.equal(err.extensions?.code, 'BAD_USER_INPUT');
          assert.deepEqual(err.extensions?.details, { field: 'name' });
          return true;
        },
      );
    });

    it('upsertInventoryItem delegates to inventoryService.upsertInventoryItem', async () => {
      const store = new Store('s1', 'Store 1', undefined, d, d);
      const product = new Product('p1', 'Prod 1', 'Cat 1', d, d);
      const item = new InventoryItem('ii1', store, product, '12.50', 3, d, d);

      const upsertInventoryItem = createAsyncSpy(async (input: any) => {
        assert.deepEqual(input, {
          storeId: 's1',
          productId: 'p1',
          price: '12.50',
          quantity: 3,
        });
        return item;
      });

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { upsertInventoryItem },
        },
      } as any);

      const result = await asResolverFn(
        resolvers.Mutation!.upsertInventoryItem,
      )(
        {},
        {
          input: {
            storeId: 's1',
            productId: 'p1',
            price: '12.50',
            quantity: 3,
          },
        },
        ctx,
        null as any,
      );

      assert.equal(upsertInventoryItem.calls.length, 1);
      assert.equal(result, item);
    });

    it('upsertInventoryItem maps NotFoundError to GraphQLError NOT_FOUND', async () => {
      const upsertInventoryItem = createAsyncSpy(async () => {
        throw new NotFoundError('Store not found');
      });

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { upsertInventoryItem },
        },
      } as any);

      await assert.rejects(
        () =>
          asResolverFn(resolvers.Mutation!.upsertInventoryItem)(
            {},
            {
              input: {
                storeId: 's1',
                productId: 'p1',
                price: '1.00',
                quantity: 1,
              },
            },
            ctx,
            null as any,
          ),
        (err: any) => {
          assert.ok(err instanceof GraphQLError);
          assert.equal(err.message, 'Store not found');
          assert.equal(err.extensions?.code, 'NOT_FOUND');
          return true;
        },
      );
    });

    it('deleteInventoryItem returns boolean from inventoryService.deleteInventoryItem', async () => {
      const deleteInventoryItem = createAsyncSpy(async (input: any) => {
        assert.deepEqual(input, { storeId: 's1', productId: 'p1' });
        return true;
      });
      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { deleteInventoryItem },
        },
      } as any);

      const result = await asResolverFn(
        resolvers.Mutation!.deleteInventoryItem,
      )({}, { storeId: 's1', productId: 'p1' }, ctx, null as any);

      assert.equal(deleteInventoryItem.calls.length, 1);
      assert.equal(result, true);
    });

    it('updateStore passes through GraphQLError unchanged', async () => {
      const gqlErr = new GraphQLError('nope', { extensions: { code: 'NOPE' } });
      const updateStore = createAsyncSpy(async () => {
        throw gqlErr;
      });

      const ctx = createCtx({
        services: {
          ...(createCtx().services as any),
          inventoryService: { updateStore },
        },
      } as any);

      await assert.rejects(
        () =>
          asResolverFn(resolvers.Mutation!.updateStore)(
            {},
            { id: 's1', input: { name: 'x', location: null } },
            ctx,
            null as any,
          ),
        (err: any) => {
          assert.equal(err, gqlErr);
          return true;
        },
      );
    });

    it('createStore maps ValidationError to GraphQLError BAD_USER_INPUT', async () => {
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

    it('updateProduct maps NotFoundError to GraphQLError NOT_FOUND', async () => {
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

    it('deleteInventoryItem maps unknown errors to GraphQLError INTERNAL', async () => {
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
  });
});
