import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { withChatrooms } from '@/server/api/routers/helpers';

const getChatrooms = protectedProcedure
  .input(
    z
      .object({
        searchKeyword: z.string().optional(),
      })
      .optional()
  )
  .query(async ({ ctx, input }) => {
    const chatrooms = await ctx.db
      .selectFrom('author')
      .select((eb) => [
        'author.author_id',
        'author.user_id',
        'author.first_name',
        'author.last_name',
        withChatrooms(eb),
      ])
      .where((eb) => eb('author.user_id', '=', ctx.auth.userId))
      .execute();

    if (chatrooms.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No author and chatroom not found',
      });
    }

    if (chatrooms.length > 1) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'More than one author found',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return chatrooms[0]!;
  });

export default getChatrooms;
