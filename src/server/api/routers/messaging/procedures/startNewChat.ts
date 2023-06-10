import { sql } from 'kysely';
import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';

import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import {
  authorsInputSchema,
  guessChatroomFromAuthorsMethod,
} from '@/server/api/routers/messaging/procedures/guessChatroomFromAuthors';
import {
  ChatroomType,
  MessageStatus,
  MessageType,
  MessageVisibility,
} from '@prisma-generated/generated/types';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

const startNewChat = protectedProcedure
  .input(
    z.object({
      authors: authorsInputSchema,
      text: z.string().min(1),
      content: z.any(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    try {
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
        await ctx.db
          .insertInto('message')
          .values((eb) => {
            return {
              text: input.text,
              type: MessageType.MESSAGE,
              content: input.content,
              status: MessageStatus.SENT,
              visibility: MessageVisibility.ALL,
              author_id: eb
                .selectFrom('author')
                .select('author_id')
                .where('author.user_id', '=', ctx.auth.userId),
              chatroom_id: chatroom.id,
              updated_at: dayjs.utc().toISOString(),
            };
          })
          .execute();

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
          .returning('chatroom.id')
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
        await trx
          .insertInto('message')
          .values((eb) => {
            return {
              text: input.text,
              type: MessageType.MESSAGE,
              content: input.content,
              status: MessageStatus.SENT,
              visibility: MessageVisibility.ALL,
              author_id: eb
                .selectFrom('author')
                .select('author_id')
                .where('author.user_id', '=', ctx.auth.userId),
              chatroom_id: _newChatroom.id,
              updated_at: dayjs.utc().toISOString(),
            };
          })
          .execute();

        return _newChatroom;
      });

      // id is unique so must only return 1
      // get chatrooms
      const findNewChatroom = await ctx.db
        .selectFrom('chatroom as c')
        .select((eb) => [
          'id',
          sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
            'user_count'
          ),
          jsonArrayFrom(
            eb
              .selectFrom('author')
              .select([
                'author.author_id',
                'author.first_name',
                'author.last_name',
                'author.user_id',
              ])
              .innerJoin(
                '_authors_on_chatrooms',
                '_authors_on_chatrooms.author_id',
                'author.author_id'
              )
              .innerJoin(
                'chatroom',
                'chatroom.id',
                '_authors_on_chatrooms.chatroom_id'
              )
              .where(sql`c.id = chatroom.id`)
          ).as('authors'),
        ])
        .innerJoin(
          '_authors_on_chatrooms',
          '_authors_on_chatrooms.chatroom_id',
          'c.id'
        )
        .innerJoin(
          'author',
          'author.author_id',
          '_authors_on_chatrooms.author_id'
        )
        .where(({ cmpr }) => cmpr('c.id', '=', newChatroom.id))
        .groupBy('id')
        .execute();

      // in case there is more than 1 then throw
      if (findNewChatroom.length > 1) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error creating chatroom',
        });
      }

      const firstNewChatroom = findNewChatroom[0];
      // if no chatroom throw error
      if (!firstNewChatroom) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error finding chatroom',
        });
      }

      return firstNewChatroom;
    } catch (e) {
      throw new TRPCError({
        cause: e,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error starting new chat',
      });
    }
  });
export default startNewChat;
