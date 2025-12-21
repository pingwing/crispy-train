import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';
import { z } from 'zod';
import {
  InventoryItemSortField,
  SortDirection,
  type InventoryItemFilterInput,
  type InventoryItemSortInput,
  type Resolvers,
} from '../generated/resolvers-types';
import { NotFoundError, ValidationError } from '../../domain';
import type {
  InventoryItemFilter,
  InventoryItemSort,
} from '../../repositories/InventoryRepository';

function toGraphQLError(err: unknown): GraphQLError {
  if (err instanceof z.ZodError) {
    return new GraphQLError('Invalid input', {
      extensions: { code: 'BAD_USER_INPUT', details: { issues: err.issues } },
    });
  }
  if (err instanceof ValidationError) {
    return new GraphQLError(err.message, {
      extensions: { code: 'BAD_USER_INPUT', details: err.details },
    });
  }
  if (err instanceof NotFoundError) {
    return new GraphQLError(err.message, { extensions: { code: 'NOT_FOUND' } });
  }
  if (err instanceof GraphQLError) return err;
  return new GraphQLError('Internal server error', {
    extensions: { code: 'INTERNAL' },
  });
}

function wrapResolver<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult> | TResult,
) {
  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await fn(...args);
    } catch (e) {
      throw toGraphQLError(e);
    }
  };
}

function toInventoryItemFilter(
  input?: InventoryItemFilterInput | null,
): InventoryItemFilter | undefined {
  if (!input) return undefined;
  const f: InventoryItemFilter = {};

  if (input.storeId != null) f.storeId = input.storeId;
  if (input.category != null) f.category = input.category;
  if (input.search != null) f.search = input.search;
  if (input.minPrice != null) f.minPrice = input.minPrice;
  if (input.maxPrice != null) f.maxPrice = input.maxPrice;
  if (input.minQuantity != null) f.minQuantity = input.minQuantity;
  if (input.maxQuantity != null) f.maxQuantity = input.maxQuantity;

  return Object.keys(f).length ? f : undefined;
}

function toInventoryItemSort(
  input?: InventoryItemSortInput | null,
): InventoryItemSort | undefined {
  if (!input) return undefined;

  const direction: InventoryItemSort['direction'] =
    (input.direction ?? SortDirection.Asc) === SortDirection.Desc
      ? 'DESC'
      : 'ASC';

  const field: InventoryItemSort['field'] = (() => {
    switch (input.field) {
      case InventoryItemSortField.StoreName:
        return 'STORE_NAME';
      case InventoryItemSortField.ProductName:
        return 'PRODUCT_NAME';
      case InventoryItemSortField.Category:
        return 'CATEGORY';
      case InventoryItemSortField.Price:
        return 'PRICE';
      case InventoryItemSortField.Quantity:
        return 'QUANTITY';
      case InventoryItemSortField.Value:
        return 'VALUE';
    }
  })();

  return { field, direction };
}

function toStoreUpdateInput(input: {
  name?: string | null;
  location?: string | null;
}): { name?: string; location?: string | null } {
  return {
    ...(input.name != null ? { name: input.name } : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
  };
}

function toProductUpdateInput(input: {
  name?: string | null;
  category?: string | null;
}): { name?: string; category?: string } {
  return {
    ...(input.name != null ? { name: input.name } : {}),
    ...(input.category != null ? { category: input.category } : {}),
  };
}

export const resolvers: Resolvers = {
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'ISO-8601 DateTime string',
    serialize(value) {
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'string') {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
      if (typeof value === 'number') {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
      throw new GraphQLError('DateTime cannot represent an invalid date value');
    },
    parseValue(value) {
      if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) return d;
      }
      throw new GraphQLError('DateTime cannot represent an invalid date value');
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        const d = new Date(ast.value);
        if (!Number.isNaN(d.getTime())) return d;
      }
      if (ast.kind === Kind.INT) {
        const d = new Date(Number(ast.value));
        if (!Number.isNaN(d.getTime())) return d;
      }
      return null;
    },
  }),
  Query: {
    _health: wrapResolver(async () => 'ok'),

    stores: wrapResolver(async (_p, _a, ctx) => {
      return ctx.services.inventoryService.listStores();
    }),

    store: wrapResolver(async (_p, args, ctx) => {
      return ctx.services.inventoryService.getStore(args.id);
    }),

    inventoryItems: wrapResolver(async (_p, args, ctx) => {
      const result = await ctx.services.inventoryService.listInventoryItems({
        filter: toInventoryItemFilter(args.filter),
        sort: toInventoryItemSort(args.sort),
        page: args.page ?? undefined,
        pageSize: args.pageSize ?? undefined,
      });
      return {
        items: result.items,
        pageInfo: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        },
      };
    }),

    storeInventorySummary: wrapResolver(async (_p, args, ctx) => {
      return ctx.services.inventoryService.getStoreInventorySummary(
        args.storeId,
      );
    }),
  },

  Mutation: {
    createStore: wrapResolver(async (_p, args, ctx) => {
      return await ctx.services.inventoryService.createStore(args.input);
    }),

    updateStore: wrapResolver(async (_p, args, ctx) => {
      return await ctx.services.inventoryService.updateStore(
        args.id,
        toStoreUpdateInput(args.input),
      );
    }),

    deleteStore: wrapResolver(async (_p, args, ctx) => {
      return await ctx.services.inventoryService.deleteStore(args.id);
    }),

    createProduct: wrapResolver(async (_p, args, ctx) => {
      return await ctx.services.inventoryService.createProduct(args.input);
    }),

    updateProduct: wrapResolver(async (_p, args, ctx) => {
      return await ctx.services.inventoryService.updateProduct(
        args.id,
        toProductUpdateInput(args.input),
      );
    }),

    upsertInventoryItem: wrapResolver(async (_p, args, ctx) => {
      return await ctx.services.inventoryService.upsertInventoryItem(
        args.input,
      );
    }),

    deleteInventoryItem: wrapResolver(async (_p, args, ctx) => {
      return await ctx.services.inventoryService.deleteInventoryItem({
        storeId: args.storeId,
        productId: args.productId,
      });
    }),
  },

  Store: {
    inventoryItems: wrapResolver(async (store, _args, ctx) => {
      return ctx.services.stores.listInventoryItems(store.id);
    }),
  },

  // inventoryValue is a getter on the domain model; default resolver will pick it up.
};
