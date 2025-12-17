import type { SqlEntityManager } from '@mikro-orm/postgresql';
import { Product as ProductEntity } from '../db/entities';
import { Product } from '../domain';
import { toDomainProduct } from './mappers';

export class ProductRepository {
  constructor(private readonly em: SqlEntityManager) {}

  async getEntityById(id: string): Promise<ProductEntity | null> {
    return this.em.findOne(ProductEntity, { id });
  }

  async getById(id: string): Promise<Product | null> {
    const p = await this.getEntityById(id);
    return p ? toDomainProduct(p) : null;
  }

  async create(input: { name: string; category: string }): Promise<Product> {
    const p = this.em.create(ProductEntity, { name: input.name, category: input.category });
    await this.em.persistAndFlush(p);
    return toDomainProduct(p);
  }

  async update(id: string, input: { name?: string; category?: string }): Promise<Product | null> {
    const p = await this.getEntityById(id);
    if (!p) return null;
    if (input.name) p.name = input.name;
    if (input.category) p.category = input.category;
    await this.em.flush();
    return toDomainProduct(p);
  }
}


