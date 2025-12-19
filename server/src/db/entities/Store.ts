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
export class Store {
  [OptionalProps]?: 'id' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = newId();

  @Property({ unique: true })
  name!: string;

  @Property({ nullable: true })
  location?: string;

  @OneToMany(() => InventoryItem, (ii) => ii.store)
  inventoryItems = new Collection<InventoryItem>(this);

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
