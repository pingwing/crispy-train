import type { Store as StoreEntity } from '../../db/entities';
import { InventoryItem, Store, ValidationError } from '../../domain';
import type { IStoreRepository } from '../StoreRepository';
import type { MemoryDb } from './memoryDb';
import { newId } from '../../utils/ids';

export class MemoryStoreRepository implements IStoreRepository {
  constructor(private readonly db: MemoryDb) {}

  async list(): Promise<Store[]> {
    return [...this.db.stores.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getById(id: string): Promise<Store | null> {
    return this.db.stores.get(id) ?? null;
  }

  async getEntityById(id: string): Promise<StoreEntity | null> {
    const store = this.db.stores.get(id);
    if (!store) return null;
    return this.toEntity(store);
  }

  async getEntityByName(name: string): Promise<StoreEntity | null> {
    const found = [...this.db.stores.values()].find((s) => s.name === name);
    return found ? this.toEntity(found) : null;
  }

  async create(input: { name: string; location?: string | null }): Promise<Store> {
    const exists = [...this.db.stores.values()].some((s) => s.name === input.name);
    if (exists) throw new ValidationError('Store name must be unique', { field: 'name' });

    const now = new Date();
    const store = new Store(newId(), input.name, input.location ?? undefined, now, now);
    this.db.stores.set(store.id, store);
    return store;
  }

  async update(id: string, input: { name?: string; location?: string | null }): Promise<Store | null> {
    const store = this.db.stores.get(id);
    if (!store) return null;

    if (input.name && input.name !== store.name) {
      const exists = [...this.db.stores.values()].some((s) => s.name === input.name && s.id !== store.id);
      if (exists) throw new ValidationError('Store name must be unique', { field: 'name' });
      store.name = input.name;
    }

    if (input.location !== undefined) store.location = input.location ?? undefined;

    // Domain model has readonly updatedAt, so keep store as-is and replace it with a new instance.
    const updated = new Store(store.id, store.name, store.location, store.createdAt, new Date());
    // Preserve any optional inventoryItems reference if tests use it.
    updated.inventoryItems = store.inventoryItems;

    this.db.stores.set(store.id, updated);
    return updated;
  }

  async listInventoryItems(storeId: string): Promise<InventoryItem[]> {
    return [...this.db.inventoryByStoreProduct.values()]
      .filter((ii) => ii.store.id === storeId)
      .sort((a, b) => a.product.name.localeCompare(b.product.name));
  }

  private toEntity(store: Store): StoreEntity {
    // For tests we only need identity-ish fields; Mikro-ORM collections/etc are irrelevant.
    return {
      id: store.id,
      name: store.name,
      location: store.location,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    } as unknown as StoreEntity;
  }
}


