import { asMoneyString } from './money';
import type { Product } from './Product';
import type { Store } from './Store';

export class InventoryItem {
  constructor(
    public readonly id: string,
    public readonly store: Store,
    public readonly product: Product,
    public price: string,
    public quantity: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get inventoryValue(): string {
    const value = Number(this.price) * Number(this.quantity);
    return asMoneyString(value);
  }
}


