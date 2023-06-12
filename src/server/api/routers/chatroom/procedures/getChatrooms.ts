import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { sql } from 'kysely';
import { TRPCError } from '@trpc/server';
import {
  ChatroomStatus,
  ChatroomType,
  Role,
} from '@prisma-generated/generated/types';

const getChatrooms = protectedProcedure
  .input(
    z
      .object({
        searchKeyword: z.string().optional(),
      })
      .optional()
  )
  .query(async ({ ctx, input }) => {
    try {
      const chatrooms = await ctx.db
        .selectFrom('chatroom')
        .select([
          'chatroom.id as id',
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
          'chatroom.created_at as created_at',
          'chatroom.updated_at as updated_at',
        ])
        .innerJoin(
          ctx.db
            .selectFrom('_authors_on_chatrooms as ac')
            .select([sql`DISTINCT ac.chatroom_id`.as('chatroom_id')])
            .leftJoin('author', 'author.author_id', 'ac.author_id')
            .where(({ cmpr, or, and }) =>
              or([
                and([
                  cmpr('author.role', '=', Role.USER),
                  cmpr('author.user_id', '!=', ctx.auth.userId),
                  cmpr(
                    'author.first_name',
                    'like',
                    `%${input?.searchKeyword ?? ''}%`
                  ),
                ]),
                and([
                  cmpr('author.role', '=', Role.USER),
                  cmpr('author.user_id', '!=', ctx.auth.userId),
                  cmpr(
                    'author.last_name',
                    'like',
                    `%${input?.searchKeyword ?? ''}%`
                  ),
                ]),
              ])
            )
            .as('matched_chatrooms'),
          'matched_chatrooms.chatroom_id',
          'chatroom.id'
        )
        .innerJoin(
          '_authors_on_chatrooms as ac',
          'ac.chatroom_id',
          'chatroom.id'
        )
        .innerJoin('author', 'author.author_id', 'ac.author_id')
        .where(({ cmpr, and }) =>
          and([
            cmpr('chatroom.type', '=', ChatroomType.HUMAN_CHATROOM),
            cmpr('chatroom.status', '=', ChatroomStatus.ACTIVE),
          ])
        )
        .groupBy(['chatroom.id', 'chatroom.created_at', 'chatroom.updated_at'])
        .execute();

      return chatrooms;
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error retrieving chatroom',
        cause: e,
      });
    }
  });

export default getChatrooms;