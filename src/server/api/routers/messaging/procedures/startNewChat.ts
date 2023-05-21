import { sql } from 'kysely';
import { TRPCError } from '@trpc/server';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import {
  MessageStatus,
  MessageType,
  MessageVisibility,
} from '../../../../../../prisma/generated/types';
import { protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';

const startNewChat = protectedProcedure
  .input(
    z.object({
      authorId: z.number(),
      text: z.string().min(1),
      content: z.any(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // get chatroom
    const chatroom = await ctx.db
      .selectFrom('chatroom')
      .select([
        'id',
        sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
          'no_of_users'
        ),
        sql<
          { author_id: number }[]
        >`JSON_AGG(JSON_BUILD_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
          'authors'
        ),
      ])
      .innerJoin(
        '_authors_on_chatrooms',
        '_authors_on_chatrooms.chatroom_id',
        'chatroom.id'
      )
      .innerJoin(
        'author',
        'author.author_id',
        '_authors_on_chatrooms.author_id'
      )
      .where(({ cmpr, or }) =>
        or([
          cmpr('author.author_id', '=', input.authorId),
          cmpr('author.user_id', '=', ctx.auth.userId),
        ])
      )
      .groupBy('id')
      .having((eb) => eb.cmpr('chatroom.no_of_users', '=', 2))
      .execute();

    if (chatroom.length > 1) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'More than one chatroom found',
      });
    }

    // if there is 1 element return the chatroom
    if (chatroom[0]) {
      return chatroom[0];
    }

    const newChatroomId = uuid();

    // create new chatroom if no chatroom found
    await ctx.db.transaction().execute(async (trx) => {
      await trx
        .insertInto('chatroom')
        .values({
          no_of_users: 2,
          updated_at: dayjs.utc().toISOString(),
          id: newChatroomId,
        })
        .execute();

      // add author to chatroom
      const test = trx
        .insertInto('_authors_on_chatrooms')
        .values((eb) => [
          {
            author_id: eb
              .selectFrom('author')
              .select('author_id')
              .where('author.user_id', '=', ctx.auth.userId),
            chatroom_id: newChatroomId,
          },
          {
            author_id: input.authorId,
            chatroom_id: newChatroomId,
          },
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
            chatroom_id: newChatroomId,
            updated_at: dayjs.utc().toISOString(),
          };
        })
        .execute();
    });

    // id is unique so must only return 1
    // get chatrooms
    const findNewChatroom = await ctx.db
      .selectFrom('chatroom')
      .select([
        'id',
        sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
          'user_count'
        ),
        sql<
          { author_id: number }[]
        >`JSON_AGG(JSON_BUILD_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
          'authors'
        ),
      ])
      .innerJoin(
        '_authors_on_chatrooms',
        '_authors_on_chatrooms.chatroom_id',
        'chatroom.id'
      )
      .innerJoin(
        'author',
        'author.author_id',
        '_authors_on_chatrooms.author_id'
      )
      .where(({ cmpr }) => cmpr('chatroom.id', '=', newChatroomId))
      .groupBy('id')
      .execute();

    if (findNewChatroom.length > 1) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error creating chatroom',
      });
    }

    // if no chatroom throw error
    if (!findNewChatroom[0]) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error finding chatroom',
      });
    }

    return findNewChatroom[0];
  });
export default startNewChat;
