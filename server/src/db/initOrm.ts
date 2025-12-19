import 'reflect-metadata';

import { MikroORM } from '@mikro-orm/postgresql';
import mikroOrmConfig from './mikro-orm.config';

export async function initOrm(): Promise<MikroORM> {
  return MikroORM.init(mikroOrmConfig);
}
