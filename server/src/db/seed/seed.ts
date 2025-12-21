import type { EntityManager } from '@mikro-orm/core';
import { InventoryItem, Product, Store } from '../entities';

export async function ensureSeedData(em: EntityManager): Promise<void> {
  const storeCount = await em.count(Store, {});
  const productCount = await em.count(Product, {});
  const inventoryCount = await em.count(InventoryItem, {});

  if (storeCount > 0 || productCount > 0 || inventoryCount > 0) return;

  const downtown = em.create(Store, {
    name: 'Downtown Market',
    location: 'Downtown',
  });
  const uptown = em.create(Store, {
    name: 'Uptown Grocery',
    location: 'Uptown',
  });
  const airport = em.create(Store, {
    name: 'Airport MiniMart',
    location: 'Airport',
  });

  const cola = em.create(Product, { name: 'Cola', category: 'Beverages' });
  const water = em.create(Product, {
    name: 'Sparkling Water',
    category: 'Beverages',
  });
  const chips = em.create(Product, {
    name: 'Potato Chips',
    category: 'Snacks',
  });
  const chocolate = em.create(Product, {
    name: 'Dark Chocolate',
    category: 'Snacks',
  });
  const soap = em.create(Product, { name: 'Hand Soap', category: 'Household' });
  const batteries = em.create(Product, {
    name: 'AA Batteries (4-pack)',
    category: 'Household',
  });
  const milk = em.create(Product, { name: 'Whole Milk', category: 'Dairy' });
  const bananas = em.create(Product, { name: 'Bananas', category: 'Produce' });
  const bread = em.create(Product, {
    name: 'Sourdough Bread',
    category: 'Bakery',
  });

  const items: Array<{
    store: Store;
    product: Product;
    price: string;
    quantity: number;
  }> = [
    // Downtown Market (9 items)
    { store: downtown, product: cola, price: '1.99', quantity: 42 },
    { store: downtown, product: water, price: '1.19', quantity: 65 },
    { store: downtown, product: chips, price: '2.49', quantity: 15 },
    { store: downtown, product: chocolate, price: '2.89', quantity: 9 },
    { store: downtown, product: soap, price: '3.99', quantity: 8 },
    { store: downtown, product: batteries, price: '6.49', quantity: 14 },
    { store: downtown, product: milk, price: '2.79', quantity: 22 },
    { store: downtown, product: bananas, price: '0.79', quantity: 33 },
    { store: downtown, product: bread, price: '3.49', quantity: 11 },

    // Uptown Grocery (9 items)
    { store: uptown, product: cola, price: '2.09', quantity: 18 },
    { store: uptown, product: water, price: '1.29', quantity: 55 },
    { store: uptown, product: chips, price: '2.69', quantity: 24 },
    { store: uptown, product: chocolate, price: '2.99', quantity: 5 },
    { store: uptown, product: soap, price: '4.29', quantity: 12 },
    { store: uptown, product: batteries, price: '6.79', quantity: 9 },
    { store: uptown, product: milk, price: '2.99', quantity: 30 },
    { store: uptown, product: bananas, price: '0.89', quantity: 48 },
    { store: uptown, product: bread, price: '3.69', quantity: 17 },

    // Airport MiniMart (9 items)
    { store: airport, product: cola, price: '2.99', quantity: 27 },
    { store: airport, product: water, price: '2.49', quantity: 120 },
    { store: airport, product: chips, price: '3.49', quantity: 10 },
    { store: airport, product: chocolate, price: '3.49', quantity: 0 },
    { store: airport, product: soap, price: '4.99', quantity: 6 },
    { store: airport, product: batteries, price: '6.99', quantity: 12 },
    { store: airport, product: milk, price: '3.49', quantity: 8 },
    { store: airport, product: bananas, price: '1.29', quantity: 4 },
    { store: airport, product: bread, price: '4.49', quantity: 3 },
  ];

  for (const it of items) {
    em.create(InventoryItem, it);
  }

  await em.flush();
}
