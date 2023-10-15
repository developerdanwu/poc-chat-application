import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

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
        .selectFrom('author')
        .select((eb) => [
          'author.author_id',
          'author.user_id',
          'author.first_name',
          'author.last_name',
          jsonArrayFrom(
            eb
              .selectFrom('chatroom')
              .innerJoin(
                '_authors_on_chatrooms',
                '_authors_on_chatrooms.chatroom_id',
                'chatroom.id'
              )
              .select((eb) => [
                'chatroom.id',
                'chatroom.status',
                'chatroom.type',
                'chatroom.created_at',
                'chatroom.updated_at',
                jsonArrayFrom(
                  eb
                    .selectFrom('author as au')
                    .innerJoin(
                      '_authors_on_chatrooms',
                      '_authors_on_chatrooms.author_id',
                      'au.author_id'
                    )
                    .select([
                      'au.first_name',
                      'au.last_name',
                      'au.user_id',
                      'au.author_id',
                      'au.role',
                      'au.created_at',
                      'au.updated_at',
                    ])
                    .whereRef(
                      '_authors_on_chatrooms.chatroom_id',
                      '=',
                      'chatroom.id'
                    )
                ).as('authors'),
              ])
              .whereRef(
                '_authors_on_chatrooms.author_id',
                '=',
                'author.author_id'
              )
          ).as('chatrooms'),
        ])
        .where((eb) => eb('author.user_id', '=', ctx.auth.userId))
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
