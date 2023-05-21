import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';

const editMessage = protectedProcedure
  .input(
    z.object({
      clientMessageId: z.number(),
      text: z.string().min(1),
      content: z.string().min(1),
    })
  )
  .mutation(async ({ ctx, input }) => {
    try {
      const author = await ctx.db
        .selectFrom('author')
        .selectAll()
        .where(({ cmpr }) => cmpr('user_id', '=', ctx.auth.userId))
        .executeTakeFirstOrThrow();

      await ctx.db.transaction().execute(async (trx) => {
        return await trx
          .updateTable('message')
          .set({
            is_edited: true,
            text: input.text,
            content: input.content,
            updated_at: dayjs.utc().toISOString(),
          })
          .where(({ cmpr, and }) =>
            and([
              cmpr('client_message_id', '=', input.clientMessageId),
              // redundant check
              cmpr('author_id', '=', author.author_id),
            ])
          )
          .returning('client_message_id')
          .executeTakeFirstOrThrow();
      });
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error updating message',
        cause: e,
      });
    }
  });

export default editMessage;
