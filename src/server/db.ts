import { Kysely } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import postgres from 'postgres';
import { env } from '@/env.mjs';
import { type DB } from '../../supabase/generated/types';

export const db = new Kysely<DB>({
  dialect: new PostgresJSDialect({
    connectionString: env.DATABASE_URL,
    options: {
      max: 10,
    },
    postgres,
  }),
});
