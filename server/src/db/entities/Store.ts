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

  @Property({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @OneToMany(() => InventoryItem, (ii) => ii.store)
  inventoryItems = new Collection<InventoryItem>(this);

  @Property({ type: 'timestamptz', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
