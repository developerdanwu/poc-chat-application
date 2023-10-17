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
import { cast, dbConfig, withAuthors } from '@/server/api/routers/helpers';

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
      const insertedMessage = await ctx.db
        .insertInto('message')
        .values((eb) => ({
          text: input.text,
          type: MessageType.MESSAGE,
          status: MessageStatus.SENT,
          visibility: MessageVisibility.ALL,
          message_checksum: input.messageChecksum,
          content: input.content,
          author_id: author.author_id,
          chatroom_id: input.chatroomId,
          updated_at: dayjs.utc().toISOString(),
        }))
        .returning('client_message_id')
        .executeTakeFirstOrThrow();

      const message = await ctx.db
        .selectFrom(`message as ${dbConfig.tableAlias.message}`)
        .select([...dbConfig.selectFields.message])
        .where('client_message_id', '=', insertedMessage.client_message_id)
        .executeTakeFirstOrThrow();

      const chatroom = await ctx.db
        .selectFrom(`chatroom as ${dbConfig.tableAlias.chatroom}`)
        .select((eb) => [
          ...dbConfig.selectFields.chatroom,
          withAuthors(eb),
          // jsonArrayFrom(
          //   eb
          //     .selectFrom(`chatroom as ${dbConfig.tableAlias.chatroom}`)
          //     .innerJoin(
          //       `_authors_on_chatrooms as ${dbConfig.tableAlias._authors_on_chatrooms}`,
          //       `${dbConfig.tableAlias._authors_on_chatrooms}.chatroom_id`,
          //       `${dbConfig.tableAlias.chatroom}.id`
          //     )
          //     .innerJoin(
          //       `message as ${dbConfig.tableAlias.message}`,
          //       `${dbConfig.tableAlias.chatroom}.id`,
          //       `${dbConfig.tableAlias.message}.chatroom_id`
          //     )
          //     .select((eb) => [
          //       ...dbConfig.selectFields.chatroom,
          //       cast(
          //         eb.fn
          //           .count(`${dbConfig.tableAlias.message}.client_message_id`)
          //           .filterWhere((eb) =>
          //             eb.and([
          //               eb(
          //                 `${dbConfig.tableAlias.message}.status`,
          //                 '=',
          //                 MessageStatus.SENT
          //               ),
          //               eb('m.author_id', '!=', ownAuthor.author_id),
          //             ])
          //           )
          //           .distinct(),
          //         'int4'
          //       ).as('unread_count'),
          //       // @ts-expect-error idk why this is not working
          //       withAuthors(eb),
          //     ])
          //     .groupBy(`${dbConfig.tableAlias.chatroom}.id`)
          //     .whereRef(
          //       `${dbConfig.tableAlias._authors_on_chatrooms}.author_id`,
          //       '=',
          //       `${dbConfig.tableAlias.author}.author_id`
          //     )
          // ).as('chatrooms'),
        ])
        .where((eb) =>
          eb(`${dbConfig.tableAlias.chatroom}.id`, '=', input.chatroomId)
        )
        .groupBy(`${dbConfig.tableAlias.chatroom}.id`)
        .executeTakeFirstOrThrow();

      for (const c of chatroom.authors) {
        const unreadCount = await ctx.db
          .selectFrom(`message as ${dbConfig.tableAlias.message}`)
          .select((eb) => [
            cast(
              eb.fn
                .count(`${dbConfig.tableAlias.message}.client_message_id`)
                .filterWhere((eb) =>
                  eb.and([
                    eb(
                      `${dbConfig.tableAlias.message}.status`,
                      '=',
                      MessageStatus.SENT
                    ),
                    eb('m.author_id', '!=', c.author_id),
                  ])
                )
                .distinct(),
              'int4'
            ).as('unread_count'),
          ])
          .executeTakeFirstOrThrow();

        await ablyRest.channels
          .get(ablyChannelKeyStore.user(c.user_id))
          .publish('unread_count', {
            ...c,
            ...unreadCount,
          });
      }

      await ablyRest.channels
        .get(ablyChannelKeyStore.chatroom(input.chatroomId))
        .publish('message', message);

      return message;
    } catch (e) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error retrieving message',
        cause: e,
      });
    }
  });

export default sendMessage;
