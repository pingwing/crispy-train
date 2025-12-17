import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { StoreDomain, ProductDomain, InventoryItemDomain } from '../../domain';
import type { GraphQLContext } from '../types';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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
};


export type QueryStoreArgs = {
  id: Scalars['ID']['input'];
};


export type QueryStoreInventorySummaryArgs = {
  storeId: Scalars['ID']['input'];
};

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



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  InventoryItem: ResolverTypeWrapper<InventoryItemDomain>;
  InventoryItemFilterInput: InventoryItemFilterInput;
  InventoryItemPage: ResolverTypeWrapper<Omit<InventoryItemPage, 'items'> & { items: Array<ResolversTypes['InventoryItem']> }>;
  InventoryItemUpsertInput: InventoryItemUpsertInput;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Product: ResolverTypeWrapper<ProductDomain>;
  ProductCreateInput: ProductCreateInput;
  ProductUpdateInput: ProductUpdateInput;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Store: ResolverTypeWrapper<StoreDomain>;
  StoreCreateInput: StoreCreateInput;
  StoreInventorySummary: ResolverTypeWrapper<Omit<StoreInventorySummary, 'store'> & { store: ResolversTypes['Store'] }>;
  StoreUpdateInput: StoreUpdateInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  DateTime: Scalars['DateTime']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  InventoryItem: InventoryItemDomain;
  InventoryItemFilterInput: InventoryItemFilterInput;
  InventoryItemPage: Omit<InventoryItemPage, 'items'> & { items: Array<ResolversParentTypes['InventoryItem']> };
  InventoryItemUpsertInput: InventoryItemUpsertInput;
  Mutation: Record<PropertyKey, never>;
  PageInfo: PageInfo;
  Product: ProductDomain;
  ProductCreateInput: ProductCreateInput;
  ProductUpdateInput: ProductUpdateInput;
  Query: Record<PropertyKey, never>;
  Store: StoreDomain;
  StoreCreateInput: StoreCreateInput;
  StoreInventorySummary: Omit<StoreInventorySummary, 'store'> & { store: ResolversParentTypes['Store'] };
  StoreUpdateInput: StoreUpdateInput;
  String: Scalars['String']['output'];
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type InventoryItemResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['InventoryItem'] = ResolversParentTypes['InventoryItem']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  inventoryValue?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  product?: Resolver<ResolversTypes['Product'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  store?: Resolver<ResolversTypes['Store'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
};

export type InventoryItemPageResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['InventoryItemPage'] = ResolversParentTypes['InventoryItemPage']> = {
  items?: Resolver<Array<ResolversTypes['InventoryItem']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createProduct?: Resolver<ResolversTypes['Product'], ParentType, ContextType, RequireFields<MutationCreateProductArgs, 'input'>>;
  createStore?: Resolver<ResolversTypes['Store'], ParentType, ContextType, RequireFields<MutationCreateStoreArgs, 'input'>>;
  updateProduct?: Resolver<ResolversTypes['Product'], ParentType, ContextType, RequireFields<MutationUpdateProductArgs, 'id' | 'input'>>;
  updateStore?: Resolver<ResolversTypes['Store'], ParentType, ContextType, RequireFields<MutationUpdateStoreArgs, 'id' | 'input'>>;
  upsertInventoryItem?: Resolver<ResolversTypes['InventoryItem'], ParentType, ContextType, RequireFields<MutationUpsertInventoryItemArgs, 'input'>>;
};

export type PageInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ProductResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Product'] = ResolversParentTypes['Product']> = {
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _health?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  inventoryItems?: Resolver<ResolversTypes['InventoryItemPage'], ParentType, ContextType, RequireFields<QueryInventoryItemsArgs, 'page' | 'pageSize'>>;
  store?: Resolver<Maybe<ResolversTypes['Store']>, ParentType, ContextType, RequireFields<QueryStoreArgs, 'id'>>;
  storeInventorySummary?: Resolver<ResolversTypes['StoreInventorySummary'], ParentType, ContextType, RequireFields<QueryStoreInventorySummaryArgs, 'storeId'>>;
  stores?: Resolver<Array<ResolversTypes['Store']>, ParentType, ContextType>;
};

export type StoreResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Store'] = ResolversParentTypes['Store']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  inventoryItems?: Resolver<Array<ResolversTypes['InventoryItem']>, ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
};

export type StoreInventorySummaryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['StoreInventorySummary'] = ResolversParentTypes['StoreInventorySummary']> = {
  lowStockCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  store?: Resolver<ResolversTypes['Store'], ParentType, ContextType>;
  totalQuantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalSkus?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalValue?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  DateTime?: GraphQLScalarType;
  InventoryItem?: InventoryItemResolvers<ContextType>;
  InventoryItemPage?: InventoryItemPageResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Product?: ProductResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Store?: StoreResolvers<ContextType>;
  StoreInventorySummary?: StoreInventorySummaryResolvers<ContextType>;
};

