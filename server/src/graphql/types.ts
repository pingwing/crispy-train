import type { MikroORM, SqlEntityManager } from '@mikro-orm/postgresql';
import type { Request } from 'express';
import type { createServices } from '../services/createServices';

export type GraphQLContext = {
  orm: MikroORM;
  em: SqlEntityManager;
  req: Request;
  services: ReturnType<typeof createServices>;
};
