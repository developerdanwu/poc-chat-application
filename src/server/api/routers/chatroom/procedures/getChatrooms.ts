import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { cast, dbConfig, withAuthors } from '@/server/api/routers/helpers';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { getOwhAuthorMethod } from '@/server/api/routers/chatroom/procedures/getOwnAuthor';
import { MessageStatus } from '@prisma-generated/generated/types';

const getChatrooms = protectedProcedure
  .input(
    z
      .object({
        searchKeyword: z.string().optional(),
      })
      .optional()
  )
  .query(async ({ ctx, input }) => {
    const ownAuthor = await getOwhAuthorMethod({ ctx });
    const chatrooms = await ctx.db
      .selectFrom(`author as ${dbConfig.tableAlias.author}`)
      .select((eb) => [
        ...dbConfig.selectFields.author,
        jsonArrayFrom(
          eb
            .selectFrom(`chatroom as ${dbConfig.tableAlias.chatroom}`)
            .innerJoin(
              `_authors_on_chatrooms as ${dbConfig.tableAlias._authors_on_chatrooms}`,
              `${dbConfig.tableAlias._authors_on_chatrooms}.chatroom_id`,
              `${dbConfig.tableAlias.chatroom}.id`
            )
            .innerJoin(
              `message as ${dbConfig.tableAlias.message}`,
              `${dbConfig.tableAlias.chatroom}.id`,
              `${dbConfig.tableAlias.message}.chatroom_id`
            )
            .innerJoin(
              `message_recepient as ${dbConfig.tableAlias.message_recepient}`,
              `${dbConfig.tableAlias.message_recepient}.message_id`,
              `${dbConfig.tableAlias.message}.client_message_id`
            )
            .select((eb) => [
              ...dbConfig.selectFields.chatroom,
              cast(
                eb.fn
                  .count(`${dbConfig.tableAlias.message}.client_message_id`)
                  .filterWhere((eb) =>
                    eb.and([
                      eb(
                        `${dbConfig.tableAlias.message}.author_id`,
                        '!=',
                        ownAuthor.author_id
                      ),
                      eb(
                        `${dbConfig.tableAlias.message_recepient}.status`,
                        '=',
                        MessageStatus.DELIVERED
                      ),
                      eb(
                        `${dbConfig.tableAlias.message_recepient}.recepient_id`,
                        '=',
                        ownAuthor.author_id
                      ),
                    ])
                  )
                  .distinct(),
                'int4'
              ).as('unread_count'),
              // @ts-expect-error idk why this is not working
              withAuthors(eb),
            ])
            .groupBy(`${dbConfig.tableAlias.chatroom}.id`)
            .whereRef(
              `${dbConfig.tableAlias._authors_on_chatrooms}.author_id`,
              '=',
              `${dbConfig.tableAlias.author}.author_id`
            )
        ).as('chatrooms'),
      ])
      .where((eb) =>
        eb(`${dbConfig.tableAlias.author}.user_id`, '=', ctx.auth.userId)
      )
      .execute();

    if (chatrooms.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No author and chatroom not found',
      });
    }

    if (chatrooms.length > 1) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'More than one author found',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return chatrooms[0]!;
  });

export default getChatrooms;
