import type { MikroORM, SqlEntityManager } from '@mikro-orm/postgresql';
import type { Request } from 'express';

export type GraphQLContext = {
  orm: MikroORM;
  em: SqlEntityManager;
  req: Request;
};


