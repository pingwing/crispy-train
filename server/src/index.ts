import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { RequestContext } from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/postgresql';

import { env } from './config/env';
import { initOrm } from './db/initOrm';
import { mikroOrmRequestContext } from './db/requestContext';
import { loadSchemaSDL } from './graphql/loadSchema';
import { resolvers } from './graphql/resolvers';
import type { GraphQLContext } from './graphql/types';
import { createServices } from './services/createServices';
import { InventoryRepository } from './repositories/InventoryRepository';
import { ProductRepository } from './repositories/ProductRepository';
import { StoreRepository } from './repositories/StoreRepository';
import { InventoryService } from './services/InventoryService';

async function main() {
  const orm = await initOrm();

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
        const em = (RequestContext.getEntityManager() ?? orm.em.fork()) as SqlEntityManager;
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
          services
        };
      },
    }),
  );

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


