import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { sql } from 'kysely';

const getChatroom = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
    })
  )
  .query(async ({ ctx, input }) => {
    const chatroom = await ctx.db
      .selectFrom('chatroom')
      .select([
        'id',
        sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
          'user_count'
        ),
        sql<
          {
            author_id: number;
            first_name: string;
            last_name: string;
            user_id: string;
          }[]
        >`JSON_AGG(JSON_BUILD_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
          'authors'
        ),
      ])
      .innerJoin(
        '_authors_on_chatrooms',
        '_authors_on_chatrooms.chatroom_id',
        'chatroom.id'
      )
      .innerJoin(
        'author',
        'author.author_id',
        '_authors_on_chatrooms.author_id'
      )
      .where(({ cmpr }) => cmpr('id', '=', input.chatroomId))
      .groupBy('id')
      .executeTakeFirst();

    if (!chatroom) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Error finding chatroom',
      });
    }

    return chatroom;
  });

export default getChatroom;
