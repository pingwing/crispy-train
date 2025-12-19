/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query Stores {\n  stores {\n    id\n    name\n    location\n  }\n}\n\nquery InventoryItems($filter: InventoryItemFilterInput, $sort: InventoryItemSortInput, $page: Int, $pageSize: Int) {\n  inventoryItems(filter: $filter, sort: $sort, page: $page, pageSize: $pageSize) {\n    pageInfo {\n      page\n      pageSize\n      total\n    }\n    items {\n      id\n      price\n      quantity\n      inventoryValue\n      store {\n        id\n        name\n      }\n      product {\n        id\n        name\n        category\n      }\n    }\n  }\n}\n\nquery StoreDetail($id: ID!) {\n  store(id: $id) {\n    id\n    name\n    location\n    inventoryItems {\n      id\n      price\n      quantity\n      inventoryValue\n      product {\n        id\n        name\n        category\n      }\n    }\n  }\n  storeInventorySummary(storeId: $id) {\n    totalSkus\n    totalQuantity\n    totalValue\n    lowStockCount\n  }\n}\n\nmutation UpsertInventoryItem($input: InventoryItemUpsertInput!) {\n  upsertInventoryItem(input: $input) {\n    id\n    price\n    quantity\n    inventoryValue\n    product {\n      id\n      name\n      category\n    }\n    store {\n      id\n      name\n    }\n  }\n}\n\nmutation CreateProduct($input: ProductCreateInput!) {\n  createProduct(input: $input) {\n    id\n    name\n    category\n  }\n}\n\nmutation CreateStore($input: StoreCreateInput!) {\n  createStore(input: $input) {\n    id\n    name\n    location\n  }\n}\n\nmutation UpdateStore($id: ID!, $input: StoreUpdateInput!) {\n  updateStore(id: $id, input: $input) {\n    id\n    name\n    location\n  }\n}": typeof types.StoresDocument,
};
const documents: Documents = {
    "query Stores {\n  stores {\n    id\n    name\n    location\n  }\n}\n\nquery InventoryItems($filter: InventoryItemFilterInput, $sort: InventoryItemSortInput, $page: Int, $pageSize: Int) {\n  inventoryItems(filter: $filter, sort: $sort, page: $page, pageSize: $pageSize) {\n    pageInfo {\n      page\n      pageSize\n      total\n    }\n    items {\n      id\n      price\n      quantity\n      inventoryValue\n      store {\n        id\n        name\n      }\n      product {\n        id\n        name\n        category\n      }\n    }\n  }\n}\n\nquery StoreDetail($id: ID!) {\n  store(id: $id) {\n    id\n    name\n    location\n    inventoryItems {\n      id\n      price\n      quantity\n      inventoryValue\n      product {\n        id\n        name\n        category\n      }\n    }\n  }\n  storeInventorySummary(storeId: $id) {\n    totalSkus\n    totalQuantity\n    totalValue\n    lowStockCount\n  }\n}\n\nmutation UpsertInventoryItem($input: InventoryItemUpsertInput!) {\n  upsertInventoryItem(input: $input) {\n    id\n    price\n    quantity\n    inventoryValue\n    product {\n      id\n      name\n      category\n    }\n    store {\n      id\n      name\n    }\n  }\n}\n\nmutation CreateProduct($input: ProductCreateInput!) {\n  createProduct(input: $input) {\n    id\n    name\n    category\n  }\n}\n\nmutation CreateStore($input: StoreCreateInput!) {\n  createStore(input: $input) {\n    id\n    name\n    location\n  }\n}\n\nmutation UpdateStore($id: ID!, $input: StoreUpdateInput!) {\n  updateStore(id: $id, input: $input) {\n    id\n    name\n    location\n  }\n}": types.StoresDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Stores {\n  stores {\n    id\n    name\n    location\n  }\n}\n\nquery InventoryItems($filter: InventoryItemFilterInput, $sort: InventoryItemSortInput, $page: Int, $pageSize: Int) {\n  inventoryItems(filter: $filter, sort: $sort, page: $page, pageSize: $pageSize) {\n    pageInfo {\n      page\n      pageSize\n      total\n    }\n    items {\n      id\n      price\n      quantity\n      inventoryValue\n      store {\n        id\n        name\n      }\n      product {\n        id\n        name\n        category\n      }\n    }\n  }\n}\n\nquery StoreDetail($id: ID!) {\n  store(id: $id) {\n    id\n    name\n    location\n    inventoryItems {\n      id\n      price\n      quantity\n      inventoryValue\n      product {\n        id\n        name\n        category\n      }\n    }\n  }\n  storeInventorySummary(storeId: $id) {\n    totalSkus\n    totalQuantity\n    totalValue\n    lowStockCount\n  }\n}\n\nmutation UpsertInventoryItem($input: InventoryItemUpsertInput!) {\n  upsertInventoryItem(input: $input) {\n    id\n    price\n    quantity\n    inventoryValue\n    product {\n      id\n      name\n      category\n    }\n    store {\n      id\n      name\n    }\n  }\n}\n\nmutation CreateProduct($input: ProductCreateInput!) {\n  createProduct(input: $input) {\n    id\n    name\n    category\n  }\n}\n\nmutation CreateStore($input: StoreCreateInput!) {\n  createStore(input: $input) {\n    id\n    name\n    location\n  }\n}\n\nmutation UpdateStore($id: ID!, $input: StoreUpdateInput!) {\n  updateStore(id: $id, input: $input) {\n    id\n    name\n    location\n  }\n}"): (typeof documents)["query Stores {\n  stores {\n    id\n    name\n    location\n  }\n}\n\nquery InventoryItems($filter: InventoryItemFilterInput, $sort: InventoryItemSortInput, $page: Int, $pageSize: Int) {\n  inventoryItems(filter: $filter, sort: $sort, page: $page, pageSize: $pageSize) {\n    pageInfo {\n      page\n      pageSize\n      total\n    }\n    items {\n      id\n      price\n      quantity\n      inventoryValue\n      store {\n        id\n        name\n      }\n      product {\n        id\n        name\n        category\n      }\n    }\n  }\n}\n\nquery StoreDetail($id: ID!) {\n  store(id: $id) {\n    id\n    name\n    location\n    inventoryItems {\n      id\n      price\n      quantity\n      inventoryValue\n      product {\n        id\n        name\n        category\n      }\n    }\n  }\n  storeInventorySummary(storeId: $id) {\n    totalSkus\n    totalQuantity\n    totalValue\n    lowStockCount\n  }\n}\n\nmutation UpsertInventoryItem($input: InventoryItemUpsertInput!) {\n  upsertInventoryItem(input: $input) {\n    id\n    price\n    quantity\n    inventoryValue\n    product {\n      id\n      name\n      category\n    }\n    store {\n      id\n      name\n    }\n  }\n}\n\nmutation CreateProduct($input: ProductCreateInput!) {\n  createProduct(input: $input) {\n    id\n    name\n    category\n  }\n}\n\nmutation CreateStore($input: StoreCreateInput!) {\n  createStore(input: $input) {\n    id\n    name\n    location\n  }\n}\n\nmutation UpdateStore($id: ID!, $input: StoreUpdateInput!) {\n  updateStore(id: $id, input: $input) {\n    id\n    name\n    location\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;