import { PrismaClient } from "@prisma/client";

import { env } from "@/env.mjs";
import { Kysely } from "kysely";
import { type DB } from "../../prisma/generated/types";
import { PlanetScaleDialect } from "kysely-planetscale";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = new Kysely<DB>({
  dialect: new PlanetScaleDialect({
    host: env.DB_HOST,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
  }),
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
