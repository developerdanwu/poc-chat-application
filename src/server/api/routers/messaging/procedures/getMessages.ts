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
                  ? [cmpr('client_message_id', '<', input.cursor)]
                  : []),
              ]);
            })
            .limit(limit)
            .orderBy('client_message_id', input.orderBy || 'desc')
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
        .orderBy('client_message_id', input.orderBy || 'desc')
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
