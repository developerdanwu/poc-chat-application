import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { ChatGPTAPI } from 'chatgpt';
import { env } from '@/env.mjs';
import { sql } from 'kysely';
import { v4 as uuid } from 'uuid';

const gpt = new ChatGPTAPI({
  apiKey: env.OPENAI_ACCESS_TOKEN as string,
});

export const messaging = createTRPCRouter({
  getAllAuthors: protectedProcedure
    .input(
      z.object({
        searchKeyword: z.string().optional(),
      })
    )
    .query(async ({ ctx }) => {
      const results = await ctx.db
        .selectFrom('author')
        .select(['author.author_id', 'author.first_name', 'author.last_name'])
        .where('author.user_id', '!=', ctx.auth.userId)
        .execute();

      return results;
    }),
  startNewChat: protectedProcedure
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
            'user_count'
          ),
          sql<
            { author_id: number }[]
          >`JSON_ARRAYAGG(JSON_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
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
        // @ts-expect-error idk why this is happening
        .having((eb) => eb.cmpr('user_count', '=', 2))
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

      // create new chatroom if no chatroom found
      const chatroomTransaction = await ctx.db
        .transaction()
        .execute(async (trx) => {
          const newChatroomId = uuid();
          await trx
            .insertInto('chatroom')
            .values({
              no_of_users: 2,
              updated_at: new Date(),
              id: newChatroomId,
            })
            .execute();

          // add author to chatroom
          await trx
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
            .values((eb) => ({
              text: input.text,
              type: 'text',
              content: input.content,
              author_id: eb
                .selectFrom('author')
                .select('author_id')
                .where('author.user_id', '=', ctx.auth.userId),
              chatroom_id: newChatroomId,
              updated_at: new Date(),
            }))
            .execute();

          // id is unique so must only return 1
          // get chatrooms
          const chatroom = await ctx.db
            .selectFrom('chatroom')
            .select([
              'id',
              sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
                'user_count'
              ),
              sql<
                { author_id: number }[]
              >`JSON_ARRAYAGG(JSON_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
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

          if (chatroom.length > 1) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error creating chatroom',
            });
          }

          // if no chatroom throw error
          if (!chatroom[0]) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error finding chatroom',
            });
          }

          return chatroom[0];
        });

      return chatroomTransaction;
    }),
  getUserId: protectedProcedure.query(({ ctx }) => {
    return {
      secret: `${ctx.auth?.userId} is using a protected prodedure`,
    };
  }),
  // TODO: improve database searching
  getChatrooms: protectedProcedure
    .input(
      z
        .object({
          searchKeyword: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const chatrooms = await ctx.db
        .selectFrom('chatroom')
        .select([
          'id',
          sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
            'user_count'
          ),
          sql<
            {
              author_id: number;
              first_name: string;
              last_name: string;
              user_id: string;
            }[]
          >`JSON_ARRAYAGG(JSON_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
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
        // .where(({ cmpr }) => cmpr("", "=", input.chatroomId))
        .groupBy('id')
        .execute();

      return chatrooms;
    }),
  getChatroom: protectedProcedure
    .input(
      z.object({
        chatroomId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const chatroom = await ctx.db
        .selectFrom('chatroom')
        .select([
          'id',
          sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
            'user_count'
          ),
          sql<
            {
              author_id: number;
              first_name: string;
              last_name: string;
              user_id: string;
            }[]
          >`JSON_ARRAYAGG(JSON_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
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
        .where(({ cmpr }) => cmpr('id', '=', input.chatroomId))
        .groupBy('id')
        .executeTakeFirst();

      if (!chatroom) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Error finding chatroom',
        });
      }

      return chatroom;
    }),
  getMessages: protectedProcedure
    .input(
      z.object({
        chatroomId: z.string().min(1),
        orderBy: z.enum(['asc', 'desc']).optional(),
        cursor: z.number().nullish(),
        skip: z.number().optional(),
        take: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.take || 10;

      const messages = await ctx.db
        .selectFrom((eb) => {
          return eb
            .selectFrom('message')
            .selectAll()
            .where(({ cmpr, and }) => {
              return and([
                cmpr('chatroom_id', '=', input.chatroomId),
                ...(input.cursor !== null && input.cursor !== undefined
                  ? [cmpr('client_message_id', '<', input.cursor)]
                  : []),
              ]);
            })
            .orderBy('client_message_id', input.orderBy || 'desc')
            .limit(limit)
            .as('message');
        })
        .select([
          sql<
            {
              client_message_id: number;
              content: string;
              author: {
                author_id: number;
                first_name: string;
                last_name: string;
                user_id: string;
              };
              text: string;
              created_at: string;
              updated_at: string;
            }[]
          >`JSON_ARRAYAGG(
                JSON_OBJECT(
                  'client_message_id', client_message_id,
                  'text', text,
                  'content', content,
                  'created_at', message.created_at,
                  'updated_at', message.updated_at, 
                  'author', JSON_OBJECT(
                    'user_id', author.user_id,
                    'author_id', author.author_id,
                    'first_name', author.first_name, 
                    'last_name', author.last_name))
                     )`.as('messages'),
          ctx.db.fn.min('client_message_id').as('next_cursor'),
        ])
        .innerJoin('author', 'author.author_id', 'message.author_id')
        .executeTakeFirst();

      console.log('MESSAGES', messages);
      return {
        messages: messages?.messages || [],
        next_cursor: messages?.next_cursor || 0,
      };
    }),
  sendMessage: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        chatroomId: z.string().min(1),
        content: z.string(),
        // TODO: add Ai model
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction().execute(async (trx) => {
        await trx
          .insertInto('message')
          .values((eb) => ({
            text: input.text,
            type: 'text',
            content: input.content,
            author_id: eb
              .selectFrom('author')
              .select('author_id')
              .where('author.user_id', '=', ctx.auth.userId),
            chatroom_id: input.chatroomId,
            updated_at: new Date(),
          }))
          .execute();
      });
    }),
});
