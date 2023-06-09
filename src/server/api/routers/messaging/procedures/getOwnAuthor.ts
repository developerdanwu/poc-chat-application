import { protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

const getOwnAuthor = protectedProcedure.query(async ({ ctx }) => {
  try {
    const author = await ctx.db
      .selectFrom('author')
      .selectAll()
      .where(({ cmpr }) => cmpr('author.user_id', '=', ctx.auth.userId))
      .executeTakeFirstOrThrow();

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
