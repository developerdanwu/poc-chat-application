import { ablyRest, protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import {
  MessageStatus,
  MessageType,
  MessageVisibility,
} from '@prisma-generated/generated/types';
import dayjs from 'dayjs';
import { ablyChannelKeyStore } from '@/lib/ably';
import { TRPCError } from '@trpc/server';
import { dbConfig, withAuthors } from '@/server/api/routers/helpers';

const sendMessage = protectedProcedure
  .input(
    z.object({
      messageChecksum: z.string().min(1),
      text: z.string().min(1),
      chatroomId: z.string().min(1),
      content: z.string(),
      // TODO: add Ai model
    })
  )
  .mutation(async ({ ctx, input }) => {
    try {
      const author = await ctx.db
        .selectFrom('author')
        .select('author_id')
        .where('author.user_id', '=', ctx.auth.userId)
        .executeTakeFirstOrThrow();

      const chatroom = await ctx.db
        .selectFrom(`chatroom as ${dbConfig.tableAlias.chatroom}`)
        .select((eb) => [...dbConfig.selectFields.chatroom, withAuthors(eb)])
        .where((eb) =>
          eb(`${dbConfig.tableAlias.chatroom}.id`, '=', input.chatroomId)
        )
        .groupBy(`${dbConfig.tableAlias.chatroom}.id`)
        .executeTakeFirstOrThrow();

      const message = await ctx.db.transaction().execute(async (trx) => {
        const _message = await trx
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
              chatroom_id: chatroom.id,
              updated_at: dayjs.utc().toISOString(),
            };
          })
          .returning([...dbConfig.selectFields.message])
          .executeTakeFirstOrThrow();
        chatroom.authors.forEach((author) => {
          trx
            .insertInto('message_recepient')
            .values((eb) => ({
              recepient_id: author.author_id,
              message_id: _message.client_message_id,
              status: MessageStatus.SENT,
            }))
            .execute();
        });

        return _message;
      });

      for (const c of chatroom.authors) {
        // const unreadCount = await ctx.db
        //   .selectFrom(`message as ${dbConfig.tableAlias.message}`)
        //   .select((eb) => [
        //     cast(
        //       eb.fn
        //         .count(`${dbConfig.tableAlias.message}.client_message_id`)
        //         .filterWhere((eb) =>
        //           eb.and([
        //             eb.or([
        //               eb(
        //                 `${dbConfig.tableAlias.message}.status`,
        //                 '=',
        //                 MessageStatus.SENT
        //               ),
        //               eb(
        //                 `${dbConfig.tableAlias.message}.status`,
        //                 '=',
        //                 MessageStatus.DELIVERED
        //               ),
        //             ]),
        //             eb(
        //               `${dbConfig.tableAlias.message}.author_id`,
        //               '!=',
        //               c.author_id
        //             ),
        //             eb(
        //               `${dbConfig.tableAlias.message}.chatroom_id`,
        //               '=',
        //               input.chatroomId
        //             ),
        //           ])
        //         )
        //         .distinct(),
        //       'int4'
        //     ).as('unread_count'),
        //   ])
        //   .executeTakeFirstOrThrow();

        await ablyRest.channels
          .get(ablyChannelKeyStore.user(c.user_id))
          .publish('get_chatrooms', {
            ...chatroom,
            unreadCount: 0,
          });
      }

      await ablyRest.channels
        .get(ablyChannelKeyStore.chatroom(input.chatroomId))
        .publish('message', message);

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
