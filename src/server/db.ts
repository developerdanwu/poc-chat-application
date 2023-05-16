import { env } from '@/env.mjs';
import { Kysely } from 'kysely';
import { type DB } from '../../prisma/generated/types';
import { PlanetScaleDialect } from 'kysely-planetscale';

export const db = new Kysely<DB>({
  dialect: new PlanetScaleDialect({
    host: env.DB_HOST,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
  }),
});
