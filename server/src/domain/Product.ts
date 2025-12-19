export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public category: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
