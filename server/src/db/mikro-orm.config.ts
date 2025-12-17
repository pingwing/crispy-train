import { defineConfig } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/core';
import { env } from '../config/env';

export default defineConfig({
  metadataProvider: ReflectMetadataProvider,
  host: env.DB_HOST,
  port: env.DB_PORT,
  dbName: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,

  // Entities are added in the next todo, but we keep these globs now so Mikro-ORM works in dev/prod.
  entities: ['dist/db/entities/**/*.js'],
  entitiesTs: ['src/db/entities/**/*.ts'],

  migrations: {
    path: 'dist/db/migrations',
    pathTs: 'src/db/migrations',
    glob: '!(*.d).{js,ts}',
  },

  debug: env.NODE_ENV !== 'production',
});


