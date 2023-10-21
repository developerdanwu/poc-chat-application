import { ablyRest, protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import {
  type DB,
  MessageStatus,
  MessageType,
  MessageVisibility,
} from '@prisma-generated/generated/types';
import dayjs from 'dayjs';
import { ablyChannelKeyStore } from '@/lib/ably';
import { TRPCError } from '@trpc/server';
import { cast, dbConfig, withAuthors } from '@/server/api/routers/helpers';
import { type SignedInAuthObject } from '@clerk/backend';
import { type Kysely } from 'kysely';
import { getChatroomMethod } from '@/server/api/routers/chatroom/procedures/getChatroom';

const sendMessageInputSchema = z.object({
  messageChecksum: z.string().min(1),
  text: z.string().min(1),
  chatroomId: z.string().min(1),
  content: z.string(),
});

type SendMessageInputSchema = z.infer<typeof sendMessageInputSchema>;

export const sendMessageMethod = async ({
  input,
  ctx,
}: {
  input: SendMessageInputSchema & {
    authors: {
      author_id: number;
    }[];
  };
  ctx: {
    db: Kysely<DB>;
    auth: SignedInAuthObject;
  };
}) => {
  console.log('AUTHORS', input.authors);
  const message = await ctx.db
    .insertInto('message')
    .values((eb) => {
      return {
        message_checksum: input.messageChecksum,
        text: input.text,
        type: MessageType.MESSAGE,
        content: input.content,
        visibility: MessageVisibility.ALL,
        author_id: eb
          .selectFrom('author')
          .select('author_id')
          .where('author.user_id', '=', ctx.auth.userId),
        chatroom_id: input.chatroomId,
        updated_at: dayjs.utc().toISOString(),
      };
    })
    .returning([...dbConfig.selectFields.message])
    .executeTakeFirstOrThrow();
  input.authors.forEach((author) => {
    ctx.db
      .insertInto('message_recepient')
      .values((eb) => ({
        recepient_id: author.author_id,
        message_id: message.client_message_id,
        status: MessageStatus.DELIVERED,
      }))
      .execute();
  });

  return message;
};

const sendMessage = protectedProcedure
  .input(sendMessageInputSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      const chatroom = await ctx.db
        .selectFrom(`chatroom as ${dbConfig.tableAlias.chatroom}`)
        .select((eb) => [...dbConfig.selectFields.chatroom, withAuthors(eb)])
        .where((eb) =>
          eb(`${dbConfig.tableAlias.chatroom}.id`, '=', input.chatroomId)
        )
        .groupBy(`${dbConfig.tableAlias.chatroom}.id`)
        .executeTakeFirstOrThrow();

      const message = await ctx.db.transaction().execute(async (trx) => {
        return await sendMessageMethod({
          ctx: {
            db: trx,
            auth: ctx.auth,
          },
          input: {
            authors: chatroom.authors,
            ...input,
          },
        });
      });

      for (const a of chatroom.authors) {
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
                      a.author_id
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
                      a.author_id
                    ),
                  ])
                )
                .distinct(),
              'int4'
            ).as('unread_count'),
          ])
          .executeTakeFirstOrThrow();

        await ablyRest.channels
          .get(ablyChannelKeyStore.user(a.user_id))
          .publish('get_chatrooms', {
            ...chatroom,
            ...unreadCount,
          });

        const updatedChatroom = await getChatroomMethod({
          ctx,
          input: {
            chatroomId: input.chatroomId,
            authorId: a.author_id,
          },
        });

        await ablyRest.channels
          .get(ablyChannelKeyStore.user(a.user_id))
          .publish('get_chatroom', updatedChatroom);

        await ablyRest.channels
          .get(ablyChannelKeyStore.user(a.user_id))
          .publish('message', message);
      }

      return message;
    } catch (e) {
      console.log(e);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error retrieving message',
        cause: e,
      });
    }
  });

export default sendMessage;
