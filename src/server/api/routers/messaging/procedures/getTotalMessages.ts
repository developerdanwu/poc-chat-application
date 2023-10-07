import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { sql } from 'kysely';

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
            .selectFrom('message')
            .selectAll()
            .where(({ cmpr, and }) => {
              return and([cmpr('chatroom_id', '=', input.chatroomId)]);
            })
            .as('message');
        })
        .select([
          sql<number>`COUNT(DISTINCT client_message_id)`.as('messages_count'),
        ])
        .execute();

      // TODO: remove hack
      return messagesCount[0];
    } catch (e) {
      return {
        messages_count: 0,
      };
    }
  });

export default getMessagesCount;
