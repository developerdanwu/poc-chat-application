import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { dbConfig } from '@/server/api/routers/helpers';

const getMessagesCount = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
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
        .select((eb) => [eb.fn.count('client_message_id').as('messages_count')])
        .executeTakeFirst();

      return messagesCount;
    } catch (e) {
      return {
        messages_count: 0,
      };
    }
  });

export default getMessagesCount;
