import { protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { type DB } from '@prisma-generated/generated/types';
import { type SignedInAuthObject } from '@clerk/backend';
import { type Kysely } from 'kysely';

export const getOwhAuthorMethod = async ({
  ctx,
}: {
  ctx: { db: Kysely<DB>; auth: SignedInAuthObject };
}) =>
  await ctx.db
    .selectFrom('author')
    .selectAll()
    .where(({ cmpr }) => cmpr('author.user_id', '=', ctx.auth.userId))
    .executeTakeFirstOrThrow();

const getOwnAuthor = protectedProcedure.query(async ({ ctx }) => {
  try {
    const author = await getOwhAuthorMethod({ ctx });

    return author;
  } catch (e) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error retrieving author',
      cause: e,
    });
  }
});

export default getOwnAuthor;
