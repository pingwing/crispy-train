import {
  Entity,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { newId } from '../../utils/ids';
import { Product } from './Product';
import { Store } from './Store';

@Entity()
@Unique({ properties: ['store', 'product'] })
export class InventoryItem {
  [OptionalProps]?: 'id' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = newId();

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

  @Property({ type: 'int' })
  quantity!: number;

  @Property({ type: 'timestamptz', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
