import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { sql } from 'kysely';

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
          sql<{
            author_id: number;
            first_name: string;
            last_name: string;
            user_id: string;
          }>`JSON_BUILD_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id)`.as(
            'author'
          ),
        ])
        .innerJoin('author', 'author.author_id', 'message.author_id')
        .orderBy('client_message_id', input.orderBy || 'desc')
        .execute();

      return {
        messages: messages || [],
        next_cursor: Math.min(...messages.map((m) => m.client_message_id)) || 0,
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
