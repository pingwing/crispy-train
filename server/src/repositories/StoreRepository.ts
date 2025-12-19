import type { SqlEntityManager } from '@mikro-orm/postgresql';
import { InventoryItem as InventoryItemEntity, Store as StoreEntity } from '../db/entities';
import { InventoryItem, Store, ValidationError } from '../domain';
import { toDomainInventoryItem, toDomainStore } from './mappers';

export interface IStoreRepository {
  list(): Promise<Store[]>;
  getById(id: string): Promise<Store | null>;
  getEntityById(id: string): Promise<StoreEntity | null>;
  getEntityByName(name: string): Promise<StoreEntity | null>;
  create(input: { name: string; location?: string | null }): Promise<Store>;
  update(id: string, input: { name?: string; location?: string | null }): Promise<Store | null>;
  listInventoryItems(storeId: string): Promise<InventoryItem[]>;
}

export class StoreRepository implements IStoreRepository {
  constructor(private readonly em: SqlEntityManager) {}

  async list(): Promise<Store[]> {
    const stores = await this.em.find(StoreEntity, {}, { orderBy: { name: 'asc' } });
    return stores.map(toDomainStore);
  }

  async getById(id: string): Promise<Store | null> {
    const store = await this.em.findOne(StoreEntity, { id });
    return store ? toDomainStore(store) : null;
  }

  async getEntityById(id: string): Promise<StoreEntity | null> {
    return this.em.findOne(StoreEntity, { id });
  }

  async getEntityByName(name: string): Promise<StoreEntity | null> {
    return this.em.findOne(StoreEntity, { name });
  }

  async create(input: { name: string; location?: string | null }): Promise<Store> {
    const exists = await this.getEntityByName(input.name);
    if (exists) throw new ValidationError('Store name must be unique', { field: 'name' });

    const store = this.em.create(StoreEntity, { name: input.name, location: input.location ?? undefined });
    await this.em.persist(store).flush();
    return toDomainStore(store);
  }

  async update(id: string, input: { name?: string; location?: string | null }): Promise<Store | null> {
    const store = await this.getEntityById(id);
    if (!store) return null;

    if (input.name && input.name !== store.name) {
      const exists = await this.getEntityByName(input.name);
      if (exists) throw new ValidationError('Store name must be unique', { field: 'name' });
      store.name = input.name;
    }

    if (input.location !== undefined) store.location = input.location ?? undefined;
    await this.em.persist(store).flush();
    return toDomainStore(store);
  }

  async listInventoryItems(storeId: string): Promise<InventoryItem[]> {
    const items = await this.em.find(
      InventoryItemEntity,
      { store: storeId },
      { populate: ['product', 'store'] as const, orderBy: { product: { name: 'asc' } } },
    );
    return items.map(toDomainInventoryItem);
  }
}


