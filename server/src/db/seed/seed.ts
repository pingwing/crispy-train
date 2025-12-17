import type { EntityManager } from '@mikro-orm/core';
import { InventoryItem, Product, Store } from '../entities';

export async function ensureSeedData(em: EntityManager): Promise<void> {
  const storeCount = await em.count(Store, {});
  const productCount = await em.count(Product, {});
  const inventoryCount = await em.count(InventoryItem, {});

  if (storeCount > 0 || productCount > 0 || inventoryCount > 0) return;

  const downtown = em.create(Store, { name: 'Downtown Market', location: 'Downtown' });
  const uptown = em.create(Store, { name: 'Uptown Grocery', location: 'Uptown' });
  const airport = em.create(Store, { name: 'Airport MiniMart', location: 'Airport' });

  const cola = em.create(Product, { name: 'Cola', category: 'Beverages' });
  const water = em.create(Product, { name: 'Sparkling Water', category: 'Beverages' });
  const chips = em.create(Product, { name: 'Potato Chips', category: 'Snacks' });
  const chocolate = em.create(Product, { name: 'Dark Chocolate', category: 'Snacks' });
  const soap = em.create(Product, { name: 'Hand Soap', category: 'Household' });
  const batteries = em.create(Product, { name: 'AA Batteries (4-pack)', category: 'Household' });

  const items: Array<{ store: Store; product: Product; price: string; quantity: number }> = [
    { store: downtown, product: cola, price: '1.99', quantity: 42 },
    { store: downtown, product: chips, price: '2.49', quantity: 15 },
    { store: downtown, product: soap, price: '3.99', quantity: 8 },

    { store: uptown, product: cola, price: '2.09', quantity: 18 },
    { store: uptown, product: water, price: '1.29', quantity: 55 },
    { store: uptown, product: chocolate, price: '2.99', quantity: 5 },

    { store: airport, product: water, price: '2.49', quantity: 120 },
    { store: airport, product: batteries, price: '6.99', quantity: 12 },
    { store: airport, product: chocolate, price: '3.49', quantity: 0 },
  ];

  for (const it of items) {
    em.create(InventoryItem, it);
  }

  await em.flush();
}


