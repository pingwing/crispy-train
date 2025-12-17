import type { Resolvers } from '../generated/resolvers-types';
import { z } from 'zod';
import { GraphQLError } from 'graphql';
import { InventoryItem, Product, Store } from '../../db/entities';

function badUserInput(message: string, details?: Record<string, unknown>) {
  return new GraphQLError(message, {
    extensions: { code: 'BAD_USER_INPUT', details },
  });
}

function notFound(message: string) {
  return new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });
}

function asMoneyString(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

export const resolvers: Resolvers = {
  Query: {
    _health: async () => 'ok',

    stores: async (_p, _a, ctx) => {
      return ctx.em.find(Store, {}, { orderBy: { name: 'asc' } });
    },

    store: async (_p, args, ctx) => {
      return ctx.em.findOne(Store, { id: args.id });
    },

    inventoryItems: async (
      _p,
      args,
      ctx,
    ) => {
      const page = Math.max(1, args.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, args.pageSize ?? 20));
      const offset = (page - 1) * pageSize;

      const qb = ctx.em
        .createQueryBuilder(InventoryItem, 'ii')
        .leftJoinAndSelect('ii.product', 'p')
        .leftJoinAndSelect('ii.store', 's');

      const f = args.filter ?? {};
      if (f.storeId) qb.andWhere({ store: f.storeId });
      if (f.category) qb.andWhere({ 'p.category': f.category });
      if (f.minQuantity != null) qb.andWhere({ quantity: { $gte: f.minQuantity } });
      if (f.maxQuantity != null) qb.andWhere({ quantity: { $lte: f.maxQuantity } });
      if (f.search) {
        const like = `%${f.search}%`;
        qb.andWhere({ $or: [{ 'p.name': { $ilike: like } }, { 's.name': { $ilike: like } }] });
      }
      if (f.minPrice != null) qb.andWhere({ price: { $gte: f.minPrice } });
      if (f.maxPrice != null) qb.andWhere({ price: { $lte: f.maxPrice } });

      qb.orderBy({ 's.name': 'asc', 'p.name': 'asc' });
      qb.offset(offset).limit(pageSize);

      const [items, total] = await qb.getResultAndCount();
      return {
        items,
        pageInfo: { page, pageSize, total },
      };
    },

    storeInventorySummary: async (_p, args, ctx) => {
      const store = await ctx.em.findOne(Store, { id: args.storeId });
      if (!store) throw notFound('Store not found');

      const rows = await ctx.em
        .createQueryBuilder(InventoryItem, 'ii')
        .select([
          'count(ii.id) as total_skus',
          'coalesce(sum(ii.quantity), 0) as total_quantity',
          'coalesce(sum(ii.quantity * ii.price), 0) as total_value',
          'coalesce(sum(case when ii.quantity <= 5 then 1 else 0 end), 0) as low_stock_count',
        ])
        .where({ store: store.id })
        .execute('get');

      const row = rows as any;
      return {
        store,
        totalSkus: Number(row.total_skus ?? 0),
        totalQuantity: Number(row.total_quantity ?? 0),
        totalValue: asMoneyString(row.total_value ?? 0),
        lowStockCount: Number(row.low_stock_count ?? 0),
      };
    },
  },

  Mutation: {
    createStore: async (_p, args, ctx) => {
      const input = z
        .object({
          name: z.string().trim().min(1).max(120),
          location: z.string().trim().min(1).max(120).optional().nullable(),
        })
        .parse(args.input);

      const exists = await ctx.em.findOne(Store, { name: input.name });
      if (exists) throw badUserInput('Store name must be unique', { field: 'name' });

      const store = ctx.em.create(Store, { name: input.name, location: input.location ?? undefined });
      await ctx.em.persistAndFlush(store);
      return store;
    },

    updateStore: async (_p, args, ctx) => {
      const input = z
        .object({
          name: z.string().trim().min(1).max(120).optional(),
          location: z.string().trim().min(1).max(120).optional().nullable(),
        })
        .parse(args.input);

      const store = await ctx.em.findOne(Store, { id: args.id });
      if (!store) throw notFound('Store not found');

      if (input.name && input.name !== store.name) {
        const exists = await ctx.em.findOne(Store, { name: input.name });
        if (exists) throw badUserInput('Store name must be unique', { field: 'name' });
        store.name = input.name;
      }
      if (input.location !== undefined) store.location = input.location ?? undefined;

      await ctx.em.flush();
      return store;
    },

    createProduct: async (_p, args, ctx) => {
      const input = z
        .object({
          name: z.string().trim().min(1).max(120),
          category: z.string().trim().min(1).max(80),
        })
        .parse(args.input);

      const product = ctx.em.create(Product, input);
      await ctx.em.persistAndFlush(product);
      return product;
    },

    updateProduct: async (_p, args, ctx) => {
      const input = z
        .object({
          name: z.string().trim().min(1).max(120).optional(),
          category: z.string().trim().min(1).max(80).optional(),
        })
        .parse(args.input);

      const product = await ctx.em.findOne(Product, { id: args.id });
      if (!product) throw notFound('Product not found');

      if (input.name) product.name = input.name;
      if (input.category) product.category = input.category;

      await ctx.em.flush();
      return product;
    },

    upsertInventoryItem: async (_p, args, ctx) => {
      const input = z
        .object({
          storeId: z.string().uuid(),
          productId: z.string().uuid(),
          price: z
            .string()
            .regex(/^[0-9]+(\\.[0-9]{1,2})?$/, 'price must be a decimal string')
            .refine((v) => Number(v) >= 0, 'price must be >= 0'),
          quantity: z.number().int().min(0).max(1_000_000),
        })
        .parse(args.input);

      const store = await ctx.em.findOne(Store, { id: input.storeId });
      if (!store) throw notFound('Store not found');
      const product = await ctx.em.findOne(Product, { id: input.productId });
      if (!product) throw notFound('Product not found');

      let item = await ctx.em.findOne(InventoryItem, { store: store.id, product: product.id });
      if (!item) {
        item = ctx.em.create(InventoryItem, { store, product, price: input.price, quantity: input.quantity });
        await ctx.em.persistAndFlush(item);
        return item;
      }

      item.price = input.price;
      item.quantity = input.quantity;
      await ctx.em.flush();
      return item;
    },
  },

  Store: {
    inventoryItems: async (store: Store, _args, ctx) => {
      return ctx.em.find(InventoryItem, { store: store.id }, { populate: ['product', 'store'] as const });
    },
  },

  InventoryItem: {
    inventoryValue: (ii: InventoryItem) => {
      const value = Number(ii.price) * Number(ii.quantity);
      return asMoneyString(value);
    },
  },
};

// Exported for unit tests (kept intentionally small/safe).
export const _internal = {
  asMoneyString,
};


