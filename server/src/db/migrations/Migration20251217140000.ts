import { Migration } from '@mikro-orm/migrations';

export class Migration20251217140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "store" (
        "id" uuid primary key,
        "name" varchar(255) not null,
        "location" varchar(255) null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null
      );
    `);
    this.addSql(
      `create unique index if not exists "store_name_unique" on "store" ("name");`,
    );

    this.addSql(`
      create table if not exists "product" (
        "id" uuid primary key,
        "name" varchar(255) not null,
        "category" varchar(255) not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null
      );
    `);
    this.addSql(
      `create index if not exists "product_category_idx" on "product" ("category");`,
    );

    this.addSql(`
      create table if not exists "inventory_item" (
        "id" uuid primary key,
        "store_id" uuid not null,
        "product_id" uuid not null,
        "price" numeric(12,2) not null,
        "quantity" int not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "inventory_item_store_id_foreign" foreign key ("store_id") references "store" ("id") on update cascade on delete cascade,
        constraint "inventory_item_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade
      );
    `);
    this.addSql(
      `create unique index if not exists "inventory_item_store_product_unique" on "inventory_item" ("store_id", "product_id");`,
    );
    this.addSql(
      `create index if not exists "inventory_item_store_idx" on "inventory_item" ("store_id");`,
    );
    this.addSql(
      `create index if not exists "inventory_item_product_idx" on "inventory_item" ("product_id");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "inventory_item" cascade;`);
    this.addSql(`drop table if exists "product" cascade;`);
    this.addSql(`drop table if exists "store" cascade;`);
  }
}
