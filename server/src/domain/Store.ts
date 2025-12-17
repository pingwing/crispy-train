import type { InventoryItem } from './InventoryItem';

export class Store {
  public inventoryItems?: InventoryItem[];

  constructor(
    public readonly id: string,
    public name: string,
    public location: string | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}


