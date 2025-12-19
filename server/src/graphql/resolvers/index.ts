import { GraphQLError } from 'graphql';
import type { Resolvers } from '../generated/resolvers-types';
import { NotFoundError, ValidationError } from '../../domain';

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
        filter: (args.filter ?? undefined) as any,
        sort: (args.sort ?? undefined) as any,
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
        return await ctx.services.inventoryService.createStore(
          args.input as any,
        );
      } catch (e) {
        throw toGraphQLError(e);
      }
    },

    updateStore: async (_p, args, ctx) => {
      try {
        return await ctx.services.inventoryService.updateStore(
          args.id,
          args.input as any,
        );
      } catch (e) {
        throw toGraphQLError(e);
      }
    },

    createProduct: async (_p, args, ctx) => {
      try {
        return await ctx.services.inventoryService.createProduct(
          args.input as any,
        );
      } catch (e) {
        throw toGraphQLError(e);
      }
    },

    updateProduct: async (_p, args, ctx) => {
      try {
        return await ctx.services.inventoryService.updateProduct(
          args.id,
          args.input as any,
        );
      } catch (e) {
        throw toGraphQLError(e);
      }
    },

    upsertInventoryItem: async (_p, args, ctx) => {
      try {
        return await ctx.services.inventoryService.upsertInventoryItem(
          args.input as any,
        );
      } catch (e) {
        throw toGraphQLError(e);
      }
    },
  },

  Store: {
    inventoryItems: async (store, _args, ctx) => {
      return ctx.services.stores.listInventoryItems((store as any).id);
    },
  },

  // inventoryValue is a getter on the domain model; default resolver will pick it up.
};
