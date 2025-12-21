import { Migration } from '@mikro-orm/migrations';

/**
 * Safety migration: drop a previously introduced global unique index on product(name),
 * because product names are only meant to be unique within a store.
 */
export class Migration20251221123000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`drop index if exists "product_name_unique";`);
  }

  override async down(): Promise<void> {
    // Intentionally left blank (we do not want to re-introduce global uniqueness).
  }
}


