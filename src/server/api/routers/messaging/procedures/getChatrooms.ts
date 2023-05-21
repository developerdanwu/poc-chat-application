import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { sql } from 'kysely';
import { TRPCError } from '@trpc/server';

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
        .selectFrom('author as a')
        .where(({ cmpr }) => cmpr('a.user_id', '=', ctx.auth.userId))
        .select([
          'a.author_id',
          'a.first_name',
          'a.last_name',
          'a.email',
          'a.role',
          'a.user_id',
          'a.created_at',
          'a.updated_at',
          sql<
            {
              id: string;
              no_of_users: number;
              created_at: string;
              updated_at: string;
              authors: {
                author_id: number;
                first_name: string;
                last_name: string;
                user_id: string;
              }[];
            }[]
          >`JSON_AGG(JSON_BUILD_OBJECT('id', chatroom.id, 'no_of_users', chatroom.no_of_users, 'created_at', chatroom.created_at, 'updated_at', chatroom.updated_at, 'authors', chatroom_authors.authors))`.as(
            'chatrooms'
          ),
        ])
        .innerJoin(
          '_authors_on_chatrooms',
          '_authors_on_chatrooms.author_id',
          'a.author_id'
        )
        .innerJoin(
          'chatroom',
          'chatroom.id',
          '_authors_on_chatrooms.chatroom_id'
        )
        .innerJoin(
          ctx.db
            .selectFrom('chatroom')
            .select([
              'chatroom.id as id',
              sql<{
                author_id: number;
                first_name: string;
                last_name: string;
                user_id: string;
              }>`JSON_AGG(JSON_BUILD_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
                'authors'
              ),
              'chatroom.created_at as created_at',
              'chatroom.updated_at as updated_at',
              'chatroom.no_of_users as no_of_users',
            ])
            .innerJoin(
              ctx.db
                .selectFrom('_authors_on_chatrooms as ac')
                .select([sql`DISTINCT ac.chatroom_id`.as('chatroom_id')])
                .leftJoin('author', 'author.author_id', 'ac.author_id')
                .where(({ cmpr, or, and }) =>
                  or([
                    and([
                      cmpr('author.user_id', '!=', ctx.auth.userId),
                      cmpr(
                        'author.first_name',
                        'like',
                        `%${input?.searchKeyword ?? ''}%`
                      ),
                    ]),
                    and([
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
            .groupBy([
              'chatroom.id',
              'chatroom.created_at',
              'chatroom.updated_at',
              'chatroom.no_of_users',
            ])
            .as('chatroom_authors'),
          'chatroom_authors.id',
          'chatroom.id'
        )
        .where('a.user_id', '=', ctx.auth.userId)
        .groupBy('a.author_id')
        .executeTakeFirst();
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
