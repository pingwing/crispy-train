import { gql } from 'urql';
import * as Urql from 'urql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
};

export type InventoryItem = {
  __typename?: 'InventoryItem';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  inventoryValue: Scalars['String']['output'];
  price: Scalars['String']['output'];
  product: Product;
  quantity: Scalars['Int']['output'];
  store: Store;
  updatedAt: Scalars['DateTime']['output'];
};

export type InventoryItemFilterInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  maxPrice?: InputMaybe<Scalars['String']['input']>;
  maxQuantity?: InputMaybe<Scalars['Int']['input']>;
  minPrice?: InputMaybe<Scalars['String']['input']>;
  minQuantity?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  storeId?: InputMaybe<Scalars['ID']['input']>;
};

export type InventoryItemPage = {
  __typename?: 'InventoryItemPage';
  items: Array<InventoryItem>;
  pageInfo: PageInfo;
};

export type InventoryItemSortField =
  | 'CATEGORY'
  | 'PRICE'
  | 'PRODUCT_NAME'
  | 'QUANTITY'
  | 'STORE_NAME'
  | 'VALUE';

export type InventoryItemSortInput = {
  direction?: InputMaybe<SortDirection>;
  field: InventoryItemSortField;
};

export type InventoryItemUpsertInput = {
  price: Scalars['String']['input'];
  productId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
  storeId: Scalars['ID']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createProduct: Product;
  createStore: Store;
  deleteInventoryItem: Scalars['Boolean']['output'];
  deleteStore: Scalars['Boolean']['output'];
  updateProduct: Product;
  updateStore: Store;
  upsertInventoryItem: InventoryItem;
};


export type MutationCreateProductArgs = {
  input: ProductCreateInput;
};


export type MutationCreateStoreArgs = {
  input: StoreCreateInput;
};


export type MutationDeleteInventoryItemArgs = {
  productId: Scalars['ID']['input'];
  storeId: Scalars['ID']['input'];
};


export type MutationDeleteStoreArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateProductArgs = {
  id: Scalars['ID']['input'];
  input: ProductUpdateInput;
};


export type MutationUpdateStoreArgs = {
  id: Scalars['ID']['input'];
  input: StoreUpdateInput;
};


export type MutationUpsertInventoryItemArgs = {
  input: InventoryItemUpsertInput;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type Product = {
  __typename?: 'Product';
  category: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ProductCreateInput = {
  category: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type ProductUpdateInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  _health: Scalars['String']['output'];
  inventoryItems: InventoryItemPage;
  store?: Maybe<Store>;
  storeInventorySummary: StoreInventorySummary;
  stores: Array<Store>;
};


export type QueryInventoryItemsArgs = {
  filter?: InputMaybe<InventoryItemFilterInput>;
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<InventoryItemSortInput>;
};


export type QueryStoreArgs = {
  id: Scalars['ID']['input'];
};


export type QueryStoreInventorySummaryArgs = {
  storeId: Scalars['ID']['input'];
};

export type SortDirection =
  | 'ASC'
  | 'DESC';

export type Store = {
  __typename?: 'Store';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  inventoryItems: Array<InventoryItem>;
  location?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type StoreCreateInput = {
  location?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type StoreInventorySummary = {
  __typename?: 'StoreInventorySummary';
  lowStockCount: Scalars['Int']['output'];
  store: Store;
  totalQuantity: Scalars['Int']['output'];
  totalSkus: Scalars['Int']['output'];
  totalValue: Scalars['String']['output'];
};

export type StoreUpdateInput = {
  location?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type StoresQueryVariables = Exact<{ [key: string]: never; }>;


export type StoresQuery = { __typename?: 'Query', stores: Array<{ __typename?: 'Store', id: string, name: string, location?: string | null }> };

export type InventoryItemsQueryVariables = Exact<{
  filter?: InputMaybe<InventoryItemFilterInput>;
  sort?: InputMaybe<InventoryItemSortInput>;
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
}>;


export type InventoryItemsQuery = { __typename?: 'Query', inventoryItems: { __typename?: 'InventoryItemPage', pageInfo: { __typename?: 'PageInfo', page: number, pageSize: number, total: number }, items: Array<{ __typename?: 'InventoryItem', id: string, price: string, quantity: number, inventoryValue: string, store: { __typename?: 'Store', id: string, name: string }, product: { __typename?: 'Product', id: string, name: string, category: string } }> } };

export type StoreDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type StoreDetailQuery = { __typename?: 'Query', store?: { __typename?: 'Store', id: string, name: string, location?: string | null, inventoryItems: Array<{ __typename?: 'InventoryItem', id: string, price: string, quantity: number, inventoryValue: string, product: { __typename?: 'Product', id: string, name: string, category: string } }> } | null, storeInventorySummary: { __typename?: 'StoreInventorySummary', totalSkus: number, totalQuantity: number, totalValue: string, lowStockCount: number } };

export type UpsertInventoryItemMutationVariables = Exact<{
  input: InventoryItemUpsertInput;
}>;


export type UpsertInventoryItemMutation = { __typename?: 'Mutation', upsertInventoryItem: { __typename?: 'InventoryItem', id: string, price: string, quantity: number, inventoryValue: string, product: { __typename?: 'Product', id: string, name: string, category: string }, store: { __typename?: 'Store', id: string, name: string } } };

export type DeleteInventoryItemMutationVariables = Exact<{
  storeId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
}>;


export type DeleteInventoryItemMutation = { __typename?: 'Mutation', deleteInventoryItem: boolean };

export type CreateProductMutationVariables = Exact<{
  input: ProductCreateInput;
}>;


export type CreateProductMutation = { __typename?: 'Mutation', createProduct: { __typename?: 'Product', id: string, name: string, category: string } };

export type UpdateProductMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ProductUpdateInput;
}>;


export type UpdateProductMutation = { __typename?: 'Mutation', updateProduct: { __typename?: 'Product', id: string, name: string, category: string } };

export type CreateStoreMutationVariables = Exact<{
  input: StoreCreateInput;
}>;


export type CreateStoreMutation = { __typename?: 'Mutation', createStore: { __typename?: 'Store', id: string, name: string, location?: string | null } };

export type UpdateStoreMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: StoreUpdateInput;
}>;


export type UpdateStoreMutation = { __typename?: 'Mutation', updateStore: { __typename?: 'Store', id: string, name: string, location?: string | null } };

export type DeleteStoreMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteStoreMutation = { __typename?: 'Mutation', deleteStore: boolean };


export const StoresDocument = gql`
    query Stores {
  stores {
    id
    name
    location
  }
}
    `;

export function useStoresQuery(options?: Omit<Urql.UseQueryArgs<StoresQueryVariables>, 'query'>) {
  return Urql.useQuery<StoresQuery, StoresQueryVariables>({ query: StoresDocument, ...options });
};
export const InventoryItemsDocument = gql`
    query InventoryItems($filter: InventoryItemFilterInput, $sort: InventoryItemSortInput, $page: Int, $pageSize: Int) {
  inventoryItems(filter: $filter, sort: $sort, page: $page, pageSize: $pageSize) {
    pageInfo {
      page
      pageSize
      total
    }
    items {
      id
      price
      quantity
      inventoryValue
      store {
        id
        name
      }
      product {
        id
        name
        category
      }
    }
  }
}
    `;

export function useInventoryItemsQuery(options?: Omit<Urql.UseQueryArgs<InventoryItemsQueryVariables>, 'query'>) {
  return Urql.useQuery<InventoryItemsQuery, InventoryItemsQueryVariables>({ query: InventoryItemsDocument, ...options });
};
export const StoreDetailDocument = gql`
    query StoreDetail($id: ID!) {
  store(id: $id) {
    id
    name
    location
    inventoryItems {
      id
      price
      quantity
      inventoryValue
      product {
        id
        name
        category
      }
    }
  }
  storeInventorySummary(storeId: $id) {
    totalSkus
    totalQuantity
    totalValue
    lowStockCount
  }
}
    `;

export function useStoreDetailQuery(options: Omit<Urql.UseQueryArgs<StoreDetailQueryVariables>, 'query'>) {
  return Urql.useQuery<StoreDetailQuery, StoreDetailQueryVariables>({ query: StoreDetailDocument, ...options });
};
export const UpsertInventoryItemDocument = gql`
    mutation UpsertInventoryItem($input: InventoryItemUpsertInput!) {
  upsertInventoryItem(input: $input) {
    id
    price
    quantity
    inventoryValue
    product {
      id
      name
      category
    }
    store {
      id
      name
    }
  }
}
    `;

export function useUpsertInventoryItemMutation() {
  return Urql.useMutation<UpsertInventoryItemMutation, UpsertInventoryItemMutationVariables>(UpsertInventoryItemDocument);
};
export const DeleteInventoryItemDocument = gql`
    mutation DeleteInventoryItem($storeId: ID!, $productId: ID!) {
  deleteInventoryItem(storeId: $storeId, productId: $productId)
}
    `;

export function useDeleteInventoryItemMutation() {
  return Urql.useMutation<DeleteInventoryItemMutation, DeleteInventoryItemMutationVariables>(DeleteInventoryItemDocument);
};
export const CreateProductDocument = gql`
    mutation CreateProduct($input: ProductCreateInput!) {
  createProduct(input: $input) {
    id
    name
    category
  }
}
    `;

export function useCreateProductMutation() {
  return Urql.useMutation<CreateProductMutation, CreateProductMutationVariables>(CreateProductDocument);
};
export const UpdateProductDocument = gql`
    mutation UpdateProduct($id: ID!, $input: ProductUpdateInput!) {
  updateProduct(id: $id, input: $input) {
    id
    name
    category
  }
}
    `;

export function useUpdateProductMutation() {
  return Urql.useMutation<UpdateProductMutation, UpdateProductMutationVariables>(UpdateProductDocument);
};
export const CreateStoreDocument = gql`
    mutation CreateStore($input: StoreCreateInput!) {
  createStore(input: $input) {
    id
    name
    location
  }
}
    `;

export function useCreateStoreMutation() {
  return Urql.useMutation<CreateStoreMutation, CreateStoreMutationVariables>(CreateStoreDocument);
};
export const UpdateStoreDocument = gql`
    mutation UpdateStore($id: ID!, $input: StoreUpdateInput!) {
  updateStore(id: $id, input: $input) {
    id
    name
    location
  }
}
    `;

export function useUpdateStoreMutation() {
  return Urql.useMutation<UpdateStoreMutation, UpdateStoreMutationVariables>(UpdateStoreDocument);
};
export const DeleteStoreDocument = gql`
    mutation DeleteStore($id: ID!) {
  deleteStore(id: $id)
}
    `;

export function useDeleteStoreMutation() {
  return Urql.useMutation<DeleteStoreMutation, DeleteStoreMutationVariables>(DeleteStoreDocument);
};