import { sql } from 'kysely';
import { TRPCError } from '@trpc/server';
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
    try {
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

      const firstChatroom = chatroom[0];
      // if there is 1 element return the chatroom
      if (firstChatroom) {
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
              chatroom_id: firstChatroom.id,
              updated_at: dayjs.utc().toISOString(),
            };
          })
          .execute();

        return firstChatroom;
      }

      // create new chatroom if no chatroom found
      const newChatroom = await ctx.db.transaction().execute(async (trx) => {
        const _newChatroom = await trx
          .insertInto('chatroom')
          .values({
            no_of_users: 2,
            updated_at: dayjs.utc().toISOString(),
          })
          .returning('chatroom.id')
          .executeTakeFirstOrThrow();

        // add author to chatroom
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
            {
              author_id: input.authorId,
              chatroom_id: _newChatroom.id,
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
        .where(({ cmpr }) => cmpr('chatroom.id', '=', newChatroom.id))
        .groupBy('id')
        .execute();

      // in case there is more than 1 then throw
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
    } catch (e) {
      throw new TRPCError({
        cause: e,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error starting new chat',
      });
    }
  });
export default startNewChat;
