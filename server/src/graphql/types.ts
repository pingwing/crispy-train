import type { MikroORM, SqlEntityManager } from '@mikro-orm/postgresql';
import type { Request } from 'express';

export type GraphQLContext = {
  orm: MikroORM;
  em: SqlEntityManager;
  req: Request;
};

// Lightweight resolver typing scaffold (hand-rolled to avoid codegen for the assignment).
export type Resolvers = {
  Query: Record<string, (parent: unknown, args: any, ctx: GraphQLContext) => any>;
  Mutation?: Record<string, (parent: unknown, args: any, ctx: GraphQLContext) => any>;
  Store?: Record<string, (parent: any, args: any, ctx: GraphQLContext) => any>;
  Product?: Record<string, (parent: any, args: any, ctx: GraphQLContext) => any>;
  InventoryItem?: Record<string, (parent: any, args: any, ctx: GraphQLContext) => any>;
};


