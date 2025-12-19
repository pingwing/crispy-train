import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { MikroORM } from '@mikro-orm/postgresql';
import { RequestContext } from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/postgresql';

import { env } from './config/env';
import { initOrm } from './db/initOrm';
import { mikroOrmRequestContext } from './db/requestContext';
import { loadSchemaSDL } from './graphql/loadSchema';
import { resolvers } from './graphql/resolvers';

import type { GraphQLContext } from './graphql/types';

// central Dependency Injection container for services and repositories
import { createServices } from './services/createServices';
import { InventoryRepository } from './repositories/InventoryRepository';
import { ProductRepository } from './repositories/ProductRepository';
import { StoreRepository } from './repositories/StoreRepository';
import { InventoryService } from './services/InventoryService';

export type CreatedApp = {
  app: express.Express;
  orm: MikroORM;
  apollo: ApolloServer<GraphQLContext>;
  dispose: () => Promise<void>;
};

/**
 * Creates the real application (Express + Apollo + MikroORM).
 * If you don't provide an ORM instance, it will initialize one using env config.
 */
export async function createApp(opts?: {
  orm?: MikroORM;
}): Promise<CreatedApp> {
  const orm = opts?.orm ?? (await initOrm());

  const typeDefs = loadSchemaSDL();
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const apollo = new ApolloServer<GraphQLContext>({
    schema,
    introspection: env.NODE_ENV !== 'production',
  });
  await apollo.start();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Ensure each request has its own EM via Mikro-ORM RequestContext.
  app.use(mikroOrmRequestContext(orm));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use(
    '/graphql',
    expressMiddleware<GraphQLContext>(apollo, {
      context: async ({ req }: { req: express.Request }) => {
        const em = (RequestContext.getEntityManager() ??
          orm.em.fork()) as SqlEntityManager;
        const services = createServices({
          em,
          StoreRepository,
          ProductRepository,
          InventoryRepository,
          InventoryService,
        });

        return {
          orm,
          em,
          req,
          services,
        };
      },
    }),
  );

  return {
    app,
    orm,
    apollo,
    dispose: async () => {
      await apollo.stop();
      // Only close when we created the ORM (i.e. not supplied).
      if (!opts?.orm) await orm.close(true);
    },
  };
}
