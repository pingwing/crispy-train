import type { Product as ProductEntity } from '../../db/entities';
import { Product } from '../../domain';
import type { IProductRepository } from '../ProductRepository';
import type { MemoryDb } from './memoryDb';
import { newId } from '../../utils/ids';

export class MemoryProductRepository implements IProductRepository {
  constructor(private readonly db: MemoryDb) {}

  async getEntityById(id: string): Promise<ProductEntity | null> {
    const p = this.db.products.get(id);
    if (!p) return null;
    return this.toEntity(p);
  }

  async getById(id: string): Promise<Product | null> {
    return this.db.products.get(id) ?? null;
  }

  async create(input: { name: string; category: string }): Promise<Product> {
    const now = new Date();
    const p = new Product(newId(), input.name, input.category, now, now);
    this.db.products.set(p.id, p);
    return p;
  }

  async update(
    id: string,
    input: { name?: string; category?: string },
  ): Promise<Product | null> {
    const p = this.db.products.get(id);
    if (!p) return null;

    const name = input.name ?? p.name;
    const category = input.category ?? p.category;
    const updated = new Product(p.id, name, category, p.createdAt, new Date());
    this.db.products.set(p.id, updated);
    return updated;
  }

  private toEntity(p: Product): ProductEntity {
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    } as unknown as ProductEntity;
  }
}
