import dayjs from 'dayjs';

import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import {
  authorsInputSchema,
  guessChatroomFromAuthorsMethod,
} from '@/server/api/routers/chatroom/procedures/guessChatroomFromAuthors';
import {
  ChatroomType,
  MessageStatus,
  MessageType,
  MessageVisibility,
} from '@prisma-generated/generated/types';
import { getChatroomMethod } from '@/server/api/routers/chatroom/procedures/getChatroom';
import { dbConfig, withAuthors } from '@/server/api/routers/helpers';

const startNewChat = protectedProcedure
  .input(
    z.object({
      authors: authorsInputSchema,
      text: z.string().min(1),
      content: z.any(),
      message_checksum: z.string().min(1),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // get chatroom
    const chatroom = await guessChatroomFromAuthorsMethod({
      input: {
        authors: input.authors,
      },
      ctx,
    });

    // if there is 1 element return the chatroom
    if (chatroom) {
      // create new message
      await ctx.db.transaction().execute(async (trx) => {
        const message = await trx
          .insertInto('message')
          .values((eb) => {
            return {
              message_checksum: input.message_checksum,
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
          .returning('client_message_id')
          .executeTakeFirstOrThrow();
        chatroom.authors.forEach((author) => {
          trx
            .insertInto('message_recepient')
            .values((eb) => ({
              recepient_id: author.author_id,
              message_id: message.client_message_id,
              status: MessageStatus.SENT,
            }))
            .execute();
        });
      });

      return chatroom;
    }

    // create new chatroom if no chatroom found
    const newChatroom = await ctx.db.transaction().execute(async (trx) => {
      const _newChatroom = await trx
        .insertInto('chatroom')
        .values({
          type: ChatroomType.HUMAN_CHATROOM,
          updated_at: dayjs.utc().toISOString(),
        })
        .returning((eb) => [...dbConfig.selectFields.chatroom, withAuthors(eb)])
        .executeTakeFirstOrThrow();

      // add authors to chatroom
      await trx
        .insertInto('_authors_on_chatrooms')
        .values((eb) => [
          {
            author_id: eb
              .selectFrom('author')
              .select('author_id')
              .where('author.user_id', '=', ctx.auth.userId),
            chatroom_id: _newChatroom.id,
          },
          ...input.authors.map((author) => ({
            author_id: author.author_id,
            chatroom_id: _newChatroom.id,
          })),
        ])
        .execute();

      // create new message
      const message = await trx
        .insertInto('message')
        .values((eb) => {
          return {
            message_checksum: input.message_checksum,
            text: input.text,
            type: MessageType.MESSAGE,
            content: input.content,
            visibility: MessageVisibility.ALL,
            author_id: eb
              .selectFrom('author')
              .select('author_id')
              .where('author.user_id', '=', ctx.auth.userId),
            chatroom_id: _newChatroom.id,
            updated_at: dayjs.utc().toISOString(),
          };
        })
        .returning('client_message_id')
        .executeTakeFirstOrThrow();
      _newChatroom.authors.forEach((author) => {
        trx
          .insertInto('message_recepient')
          .values((eb) => ({
            recepient_id: author.author_id,
            message_id: message.client_message_id,
            status: MessageStatus.SENT,
          }))
          .execute();
      });

      return _newChatroom;
    });

    // id is unique so must only return 1
    // get chatrooms
    const resultChatroom = await getChatroomMethod({
      input: {
        chatroomId: newChatroom.id,
      },
      ctx,
    });

    return resultChatroom;
  });
export default startNewChat;
