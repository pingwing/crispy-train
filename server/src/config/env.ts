import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load env from a local file if present. In Docker, env is typically injected by compose.
dotenvConfig({ path: process.env.DOTENV_CONFIG_PATH ?? '.env' });

const EnvSchema = z.object({
  NODE_ENV: z.string().optional().default('development'),
  PORT: z.coerce.number().int().positive().optional().default(4000),

  DB_HOST: z.string().optional().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().optional().default(5432),
  DB_NAME: z.string().optional().default('knostic_shop'),
  DB_USER: z.string().optional().default('knostic'),
  DB_PASSWORD: z.string().optional().default('knostic'),
});

export const env = EnvSchema.parse(process.env);
