import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { cast, dbConfig } from '@/server/api/routers/helpers';

const getMessagesCount = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
    })
  )
  .query(async ({ ctx, input }) => {
    const messagesCount = await ctx.db
      .selectFrom((eb) => {
        return eb
          .selectFrom(`message as ${dbConfig.tableAlias.message}`)
          .selectAll()
          .where((eb) => {
            return eb('chatroom_id', '=', input.chatroomId);
          })
          .as('message');
      })
      .select((eb) => [
        cast(eb.fn.count('client_message_id'), 'int4').as('messages_count'),
      ])
      .executeTakeFirstOrThrow();

    return messagesCount;
  });

export default getMessagesCount;
