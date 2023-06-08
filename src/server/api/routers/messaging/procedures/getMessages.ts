import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';

const getMessages = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
      orderBy: z.enum(['asc', 'desc']).optional(),
      cursor: z.number().nullish(),
      skip: z.number().optional(),
      take: z.number().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const limit = input.take || 10;
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
                  ? [cmpr('client_message_id', '<', input.cursor)]
                  : []),
              ]);
            })
            .limit(limit)
            .orderBy('client_message_id', input.orderBy || 'desc')
            .as('message');
        })
        .select([
          'client_message_id',
          'text',
          'is_edited',
          'content',
          'message.created_at',
          'message.updated_at',
          'message.author_id',
        ])
        .orderBy('client_message_id', input.orderBy || 'desc')
        .execute();

      return {
        messages: messages || [],
        next_cursor:
          messages.length > 0
            ? Math.min(...messages.map((m) => m.client_message_id))
            : 0,
      };
    } catch (e) {
      return {
        // TODO: should throw 500?
        messages: [],
        next_cursor: 0,
      };
    }
  });

export default getMessages;
