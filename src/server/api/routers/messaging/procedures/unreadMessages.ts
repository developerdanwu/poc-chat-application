import { ablyRest, protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { MessageStatus } from '@prisma-generated/generated/types';
import { cast, dbConfig } from '@/server/api/routers/helpers';
import { ablyChannelKeyStore } from '@/lib/ably';
import { getChatroomMethod } from '@/server/api/routers/chatroom/procedures/getChatroom';
import { getOwhAuthorMethod } from '@/server/api/routers/chatroom/procedures/getOwnAuthor';
import { readAllMessagesMethod } from '@/server/api/routers/messaging/procedures/readAllMessages';

const unreadMessages = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
      createdAtTimestamp: z.date(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const ownAuthor = await getOwhAuthorMethod({ ctx });

    await ctx.db.transaction().execute(async (trx) => {
      await readAllMessagesMethod({
        ctx: {
          db: trx,
          auth: ctx.auth,
        },
        input: {
          chatroomId: input.chatroomId,
          authorId: ownAuthor.author_id,
        },
      });

      await trx
        .updateTable('message_recepient')
        .set((eb) => ({
          status: MessageStatus.DELIVERED,
        }))
        .from(`message as ${dbConfig.tableAlias.message}`)
        .from(`author as ${dbConfig.tableAlias.author}`)
        .where((eb) =>
          eb.and([
            eb(
              `${dbConfig.tableAlias.message}.chatroom_id`,
              '=',
              input.chatroomId
            ),
            eb('status', '=', MessageStatus.READ),
            eb(
              `${dbConfig.tableAlias.message_recepient}.recepient_id`,
              '=',
              ownAuthor.author_id
            ),
            eb('message_recepient.created_at', '>=', input.createdAtTimestamp),
          ])
        )
        .returning(['message.created_at'])
        .execute();
    });

    const chatroom = await getChatroomMethod({
      ctx,
      input: {
        chatroomId: input.chatroomId,
        authorId: ownAuthor.author_id,
      },
    });

    const unreadCount = await ctx.db
      .selectFrom(`message as ${dbConfig.tableAlias.message}`)
      .innerJoin(
        `message_recepient as ${dbConfig.tableAlias.message_recepient}`,
        `${dbConfig.tableAlias.message_recepient}.message_id`,
        `${dbConfig.tableAlias.message}.client_message_id`
      )
      .select((eb) => [
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
                  `${dbConfig.tableAlias.message}.chatroom_id`,
                  '=',
                  input.chatroomId
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
      ])
      .executeTakeFirstOrThrow();

    await ablyRest.channels
      .get(ablyChannelKeyStore.user(ownAuthor.user_id))
      .publish('get_chatrooms', {
        ...chatroom,
        ...unreadCount,
      });

    await ablyRest.channels
      .get(ablyChannelKeyStore.user(ownAuthor.user_id))
      .publish('get_chatroom', {
        ...chatroom,
        ...unreadCount,
      });

    return chatroom;
  });

export default unreadMessages;
