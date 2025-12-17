import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Product } from './Product';
import { Store } from './Store';

@Entity()
@Unique({ properties: ['store', 'product'] })
export class InventoryItem {
  [OptionalProps]?: 'id' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @ManyToOne(() => Store)
  store!: Store;

  @ManyToOne(() => Product)
  product!: Product;

  /**
   * Stored as a string to avoid floating point precision errors.
   * Format is typically "12.34".
   */
  @Property({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @Property()
  quantity!: number;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}


