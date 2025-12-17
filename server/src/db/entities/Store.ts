import { Collection, Entity, OneToMany, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { InventoryItem } from './InventoryItem';

@Entity()
export class Store {
  [OptionalProps]?: 'id' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

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


