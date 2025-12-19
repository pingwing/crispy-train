import {
  Collection,
  Entity,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { InventoryItem } from './InventoryItem';
import { newId } from '../../utils/ids';

@Entity()
export class Product {
  [OptionalProps]?: 'id' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = newId();

  @Property()
  name!: string;

  @Property()
  category!: string;

  @OneToMany(() => InventoryItem, (ii) => ii.product)
  inventoryItems = new Collection<InventoryItem>(this);

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
