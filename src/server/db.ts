import { Kysely } from 'kysely';
import { type DB } from '@prisma-generated/generated/types';
import { PostgresJSDialect } from 'kysely-postgres-js';
import postgres from 'postgres';
import { env } from '@/env.mjs';

export const db = new Kysely<DB>({
  dialect: new PostgresJSDialect({
    connectionString: env.DATABASE_URL,
    options: {
      max: 10,
    },
    postgres,
  }),
});
