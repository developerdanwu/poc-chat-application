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
    const author = await ctx.db
      .selectFrom('author')
      .selectAll()
      .where(({ cmpr }) => cmpr('user_id', '=', ctx.auth.userId))
      .executeTakeFirst();

    if (!author) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Error finding author',
      });
    }

    await ctx.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('message')
        .set({
          text: input.text,
          content: input.content,
          updated_at: dayjs.utc().toISOString(),
        })
        .where(({ cmpr, and }) =>
          and([
            cmpr('client_message_id', '=', input.clientMessageId),
            cmpr('author_id', '=', author.author_id),
          ])
        )
        .execute();
    });
  });

export default editMessage;
