import { z } from 'zod';
import type {
  IInventoryRepository,
  InventoryItemFilter,
  InventoryItemSort,
} from '../repositories/InventoryRepository';
import type { IStoreRepository } from '../repositories/StoreRepository';
import type { IProductRepository } from '../repositories/ProductRepository';
import { NotFoundError, ValidationError } from '../domain';

function parseOrValidationError<T>(
  schema: z.ZodType<T>,
  input: unknown,
  message = 'Invalid input',
): T {
  const res = schema.safeParse(input);
  if (res.success) return res.data;
  throw new ValidationError(message, { issues: res.error.issues });
}

const DecimalString = z
  .string()
  .regex(/^[0-9]+(\.[0-9]{1,2})?$/, 'must be a decimal string')
  .refine((v) => Number(v) >= 0, 'must be >= 0');

const InventoryItemFilterSchema = z
  .object({
    storeId: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    search: z.string().trim().min(1).max(120).optional(),
    minPrice: DecimalString.optional(),
    maxPrice: DecimalString.optional(),
    minQuantity: z.number().int().min(0).optional(),
    maxQuantity: z.number().int().min(0).optional(),
  })
  .refine(
    (v) =>
      v.minQuantity === undefined ||
      v.maxQuantity === undefined ||
      v.minQuantity <= v.maxQuantity,
    { message: 'minQuantity must be <= maxQuantity' },
  )
  .refine(
    (v) =>
      v.minPrice === undefined ||
      v.maxPrice === undefined ||
      Number(v.minPrice) <= Number(v.maxPrice),
    { message: 'minPrice must be <= maxPrice' },
  );

export class InventoryService {
  constructor(
    private readonly stores: IStoreRepository,
    private readonly products: IProductRepository,
    private readonly inventory: IInventoryRepository,
  ) {}

  listStores() {
    return this.stores.list();
  }

  async getStore(id: string) {
    return this.stores.getById(id);
  }

  async listInventoryItems(args: {
    filter?: InventoryItemFilter;
    sort?: InventoryItemSort;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, args.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, args.pageSize ?? 20));
    const filter =
      args.filter && Object.keys(args.filter).length
        ? parseOrValidationError(
            InventoryItemFilterSchema,
            args.filter,
            'Invalid filter',
          )
        : {};
    return this.inventory.listInventoryItems(filter, page, pageSize, args.sort);
  }

  async getStoreInventorySummary(storeId: string) {
    const summary = await this.inventory.storeInventorySummary(storeId);
    if (!summary) throw new NotFoundError('Store not found');
    return summary;
  }

  async createStore(input: { name: string; location?: string | null }) {
    const parsed = parseOrValidationError(
      z.object({
        name: z.string().trim().min(1).max(120),
        location: z.string().trim().min(1).max(120).optional().nullable(),
      }),
      input,
    );
    return this.stores.create(parsed);
  }

  async updateStore(
    id: string,
    input: { name?: string; location?: string | null },
  ) {
    const parsed = parseOrValidationError(
      z.object({
        name: z.string().trim().min(1).max(120).optional(),
        location: z.string().trim().min(1).max(120).optional().nullable(),
      }),
      input,
    );

    const store = await this.stores.update(id, parsed);
    if (!store) throw new NotFoundError('Store not found');
    return store;
  }

  async deleteStore(id: string) {
    const parsed = parseOrValidationError(
      z.string().uuid(),
      id,
      'Invalid store id',
    );
    const deleted = await this.stores.delete(parsed);
    if (!deleted) throw new NotFoundError('Store not found');
    return true;
  }

  async createProduct(input: { name: string; category: string }) {
    const parsed = parseOrValidationError(
      z.object({
        name: z.string().trim().min(1).max(120),
        category: z.string().trim().min(1).max(80),
      }),
      input,
    );

    return this.products.create(parsed);
  }

  async updateProduct(id: string, input: { name?: string; category?: string }) {
    const parsed = parseOrValidationError(
      z.object({
        name: z.string().trim().min(1).max(120).optional(),
        category: z.string().trim().min(1).max(80).optional(),
      }),
      input,
    );

    const existing = await this.products.getEntityById(id);
    if (!existing) throw new NotFoundError('Product not found');

    if (parsed.name && parsed.name !== existing.name) {
      const storeIds = await this.inventory.listStoreIdsForProduct(id);
      const validStoreIds = storeIds.filter((sid) =>
        z.string().uuid().safeParse(sid).success,
      );

      for (const storeId of validStoreIds) {
        const conflict = await this.inventory.hasProductNameConflictInStore({
          storeId,
          productName: parsed.name,
          excludeProductId: id,
        });
        if (conflict) {
          throw new ValidationError('Product name must be unique in this store', {
            field: 'name',
          });
        }
      }
    }

    const updated = await this.products.update(id, parsed);
    if (!updated) throw new NotFoundError('Product not found');
    return updated;
  }

  async upsertInventoryItem(input: {
    storeId: string;
    productId: string;
    price: string;
    quantity: number;
  }) {
    const parsed = parseOrValidationError(
      z.object({
        storeId: z.string().uuid(),
        productId: z.string().uuid(),
        price: DecimalString,
        quantity: z.number().int().min(0).max(1_000_000),
      }),
      input,
    );

    const store = await this.stores.getEntityById(parsed.storeId);
    if (!store) throw new NotFoundError('Store not found');
    const product = await this.products.getEntityById(parsed.productId);
    if (!product) throw new NotFoundError('Product not found');

    // Enforce product name uniqueness per-store (products are global).
    const existingInStore = await this.stores.listInventoryItems(
      parsed.storeId,
    );
    const nameConflict = existingInStore.find(
      (ii) => ii.product.name === product.name && ii.product.id !== product.id,
    );
    if (nameConflict) {
      throw new ValidationError('Product name must be unique in this store', {
        field: 'name',
      });
    }

    const item = await this.inventory.upsertInventoryItem(parsed);
    if (!item) throw new ValidationError('Could not upsert inventory item');
    return item;
  }

  async deleteInventoryItem(input: { storeId: string; productId: string }) {
    const parsed = parseOrValidationError(
      z.object({
        storeId: z.string().uuid(),
        productId: z.string().uuid(),
      }),
      input,
    );

    const deleted = await this.inventory.deleteInventoryItem(parsed);
    if (!deleted) throw new NotFoundError('Inventory item not found');
    return true;
  }
}
