import { GraphQLError } from 'graphql';
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
  Query: {
    _health: async () => 'ok',

    stores: async (_p, _a, ctx) => {
      return ctx.services.inventoryService.listStores();
    },

    store: async (_p, args, ctx) => {
      return ctx.services.inventoryService.getStore(args.id);
    },

    inventoryItems: async (_p, args, ctx) => {
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
    },

    storeInventorySummary: async (_p, args, ctx) => {
      return ctx.services.inventoryService.getStoreInventorySummary(
        args.storeId,
      );
    },
  },

  Mutation: {
    createStore: async (_p, args, ctx) => {
      try {
        return await ctx.services.inventoryService.createStore(args.input);
      } catch (e) {
        throw toGraphQLError(e);
      }
    },

    updateStore: async (_p, args, ctx) => {
      try {
        return await ctx.services.inventoryService.updateStore(
          args.id,
          toStoreUpdateInput(args.input),
        );
      } catch (e) {
        throw toGraphQLError(e);
      }
    },

    createProduct: async (_p, args, ctx) => {
      try {
        return await ctx.services.inventoryService.createProduct(args.input);
      } catch (e) {
        throw toGraphQLError(e);
      }
    },

    updateProduct: async (_p, args, ctx) => {
      try {
        return await ctx.services.inventoryService.updateProduct(
          args.id,
          toProductUpdateInput(args.input),
        );
      } catch (e) {
        throw toGraphQLError(e);
      }
    },

    upsertInventoryItem: async (_p, args, ctx) => {
      try {
        return await ctx.services.inventoryService.upsertInventoryItem(args.input);
      } catch (e) {
        throw toGraphQLError(e);
      }
    },

    deleteInventoryItem: async (_p, args, ctx) => {
      try {
        return await ctx.services.inventoryService.deleteInventoryItem({
          storeId: args.storeId,
          productId: args.productId,
        });
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
  },

  Store: {
    inventoryItems: async (store, _args, ctx) => {
      return ctx.services.stores.listInventoryItems(store.id);
    },
  },

  // inventoryValue is a getter on the domain model; default resolver will pick it up.
};
