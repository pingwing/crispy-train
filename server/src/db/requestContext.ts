import type { NextFunction, Request, Response } from 'express';
import type { MikroORM } from '@mikro-orm/postgresql';
import { RequestContext } from '@mikro-orm/core';

export function mikroOrmRequestContext(orm: MikroORM) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // Create a per-request EM fork (identity map) and bind it to AsyncLocalStorage.
    RequestContext.create(orm.em.fork(), next);
  };
}
