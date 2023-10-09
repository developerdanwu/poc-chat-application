import {protectedProcedure} from '@/server/api/trpc';
import {z} from 'zod'; // implement a before and latest

// implement a before and latest

const getMessages = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
      orderBy: z.enum(['asc', 'desc']).optional(),
      cursor: z.date().nullish(),
      skip: z.number().optional(),
      take: z.number().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const limit = input.take || 20;
    try {
      const messages = await ctx.db
        .selectFrom((eb) => {
          return eb
            .selectFrom('message')
            .selectAll()
            .where(({ cmpr, and }) => {
              return and([
                cmpr('chatroom_id', '=', input.chatroomId),
                ...(input.cursor !== null && input.cursor !== undefined
                  ? [cmpr('created_at', '<', input.cursor)]
                  : []),
              ]);
            })
            .limit(limit)
            .orderBy('created_at', input.orderBy || 'desc')
            .as('message');
        })
        .select([
          'message_checksum',
          'client_message_id',
          'text',
          'is_edited',
          'content',
          'message.created_at',
          'message.updated_at',
          'message.author_id',
        ])
        .execute();

      return {
        messages: messages || [],
      };
    } catch (e) {
      return {
        // TODO: should throw 500?
        messages: [],
      };
    }
  });

export default getMessages;
