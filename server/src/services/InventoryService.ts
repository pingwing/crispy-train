import { z } from 'zod';
import type {
  IInventoryRepository,
  InventoryItemFilter,
} from '../repositories/InventoryRepository';
import type { IStoreRepository } from '../repositories/StoreRepository';
import type { IProductRepository } from '../repositories/ProductRepository';
import { NotFoundError, ValidationError } from '../domain';

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
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, args.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, args.pageSize ?? 20));
    const filter = args.filter ?? {};
    return this.inventory.listInventoryItems(filter, page, pageSize);
  }

  async getStoreInventorySummary(storeId: string) {
    const summary = await this.inventory.storeInventorySummary(storeId);
    if (!summary) throw new NotFoundError('Store not found');
    return summary;
  }

  async createStore(input: { name: string; location?: string | null }) {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(120),
        location: z.string().trim().min(1).max(120).optional().nullable(),
      })
      .parse(input);
    return this.stores.create(parsed);
  }

  async updateStore(
    id: string,
    input: { name?: string; location?: string | null },
  ) {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(120).optional(),
        location: z.string().trim().min(1).max(120).optional().nullable(),
      })
      .parse(input);

    const store = await this.stores.update(id, parsed);
    if (!store) throw new NotFoundError('Store not found');
    return store;
  }

  async createProduct(input: { name: string; category: string }) {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(120),
        category: z.string().trim().min(1).max(80),
      })
      .parse(input);

    return this.products.create(parsed);
  }

  async updateProduct(id: string, input: { name?: string; category?: string }) {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(120).optional(),
        category: z.string().trim().min(1).max(80).optional(),
      })
      .parse(input);

    const product = await this.products.update(id, parsed);
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  async upsertInventoryItem(input: {
    storeId: string;
    productId: string;
    price: string;
    quantity: number;
  }) {
    const parsed = z
      .object({
        storeId: z.string().uuid(),
        productId: z.string().uuid(),
        price: z
          .string()
          .regex(/^[0-9]+(\.[0-9]{1,2})?$/, 'price must be a decimal string')
          .refine((v) => Number(v) >= 0, 'price must be >= 0'),
        quantity: z.number().int().min(0).max(1_000_000),
      })
      .parse(input);

    const store = await this.stores.getEntityById(parsed.storeId);
    if (!store) throw new NotFoundError('Store not found');
    const product = await this.products.getEntityById(parsed.productId);
    if (!product) throw new NotFoundError('Product not found');

    const item = await this.inventory.upsertInventoryItem(parsed);
    if (!item) throw new ValidationError('Could not upsert inventory item');
    return item;
  }
}
