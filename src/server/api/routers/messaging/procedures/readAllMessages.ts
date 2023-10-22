import { ablyRest, protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { type DB, MessageStatus } from '@prisma-generated/generated/types';
import { cast, dbConfig } from '@/server/api/routers/helpers';
import { ablyChannelKeyStore } from '@/lib/ably';
import { getChatroomMethod } from '@/server/api/routers/chatroom/procedures/getChatroom';
import { getOwhAuthorMethod } from '@/server/api/routers/chatroom/procedures/getOwnAuthor';
import { type Kysely } from 'kysely';
import { type SignedInAuthObject } from '@clerk/backend';

export const readAllMessagesMethod = async ({
  ctx,
  input,
}: {
  input: {
    chatroomId: string;
    authorId: number;
  };
  ctx: {
    db: Kysely<DB>;
    auth: SignedInAuthObject;
  };
}) => {
  return await ctx.db
    .updateTable('message_recepient')
    .set((eb) => ({
      status: MessageStatus.READ,
    }))
    .from(`message as ${dbConfig.tableAlias.message}`)
    .from(`author as ${dbConfig.tableAlias.author}`)
    .where((eb) =>
      eb.and([
        eb(`${dbConfig.tableAlias.message}.chatroom_id`, '=', input.chatroomId),

        eb('status', '=', MessageStatus.DELIVERED),
        eb(
          `${dbConfig.tableAlias.message_recepient}.recepient_id`,
          '=',
          input.authorId
        ),
      ])
    )
    .execute();
};

// TODO: read all messages
const readAllMessages = protectedProcedure
  .input(
    z.object({
      chatroomId: z.string().min(1),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const ownAuthor = await getOwhAuthorMethod({ ctx });

    await readAllMessagesMethod({
      ctx,
      input: {
        chatroomId: input.chatroomId,
        authorId: ownAuthor.author_id,
      },
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

    return chatroom;
  });

export default readAllMessages;
