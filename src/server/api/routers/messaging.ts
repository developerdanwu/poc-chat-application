import {
  ablyRest,
  createTRPCRouter,
  protectedProcedure,
} from '@/server/api/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { ChatGPTAPI } from 'chatgpt';
import { env } from '@/env.mjs';
import { sql } from 'kysely';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { ablyChannelKeyStore } from '@/lib/ably';
import {
  MessageStatus,
  MessageType,
  MessageVisibility,
} from '../../../../prisma/generated/types';

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
        .having((eb) => eb.cmpr('no_of_users', '=', 2))
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
      const chatroomTransaction = await ctx.db
        .transaction()
        .execute(async (trx) => {
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
        .selectFrom('author as a')
        .where(({ cmpr }) => cmpr('a.user_id', '=', ctx.auth.userId))
        .select([
          'a.author_id',
          'a.first_name',
          'a.last_name',
          'a.email',
          'a.role',
          'a.user_id',
          'a.created_at',
          'a.updated_at',
          sql<
            {
              id: string;
              no_of_users: number;
              created_at: string;
              updated_at: string;
              authors: {
                author_id: number;
                first_name: string;
                last_name: string;
                user_id: string;
              }[];
            }[]
          >`JSON_AGG(JSON_BUILD_OBJECT('id', chatroom.id, 'no_of_users', chatroom.no_of_users, 'created_at', chatroom.created_at, 'updated_at', chatroom.updated_at, 'authors', chatroom_authors.authors))`.as(
            'chatrooms'
          ),
        ])
        .innerJoin(
          '_authors_on_chatrooms',
          '_authors_on_chatrooms.author_id',
          'a.author_id'
        )
        .innerJoin(
          'chatroom',
          'chatroom.id',
          '_authors_on_chatrooms.chatroom_id'
        )
        .innerJoin(
          ctx.db
            .selectFrom('chatroom')
            .select([
              'chatroom.id as id',
              sql<{
                author_id: number;
                first_name: string;
                last_name: string;
                user_id: string;
              }>`JSON_AGG(JSON_BUILD_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
                'authors'
              ),
              'chatroom.created_at as created_at',
              'chatroom.updated_at as updated_at',
              'chatroom.no_of_users as no_of_users',
            ])
            .innerJoin(
              ctx.db
                .selectFrom('_authors_on_chatrooms as ac')
                .select([sql`DISTINCT ac.chatroom_id`.as('chatroom_id')])
                .leftJoin('author', 'author.author_id', 'ac.author_id')
                .where(({ cmpr, or, and }) =>
                  or([
                    and([
                      cmpr('author.user_id', '!=', ctx.auth.userId),
                      cmpr(
                        'author.first_name',
                        'like',
                        `%${input?.searchKeyword ?? ''}%`
                      ),
                    ]),
                    and([
                      cmpr('author.user_id', '!=', ctx.auth.userId),
                      cmpr(
                        'author.last_name',
                        'like',
                        `%${input?.searchKeyword ?? ''}%`
                      ),
                    ]),
                  ])
                )
                .as('matched_chatrooms'),
              'matched_chatrooms.chatroom_id',
              'chatroom.id'
            )
            .innerJoin(
              '_authors_on_chatrooms as ac',
              'ac.chatroom_id',
              'chatroom.id'
            )
            .innerJoin('author', 'author.author_id', 'ac.author_id')
            .groupBy([
              'chatroom.id',
              'chatroom.created_at',
              'chatroom.updated_at',
              'chatroom.no_of_users',
            ])
            .as('chatroom_authors'),
          'chatroom_authors.id',
          'chatroom.id'
        )
        .where('a.user_id', '=', ctx.auth.userId)
        .groupBy('a.author_id')
        .executeTakeFirst();

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

      try {
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
              .limit(limit)
              .orderBy('client_message_id', input.orderBy || 'desc')
              .as('message');
          })
          .select([
            'client_message_id',
            'text',
            'content',
            'message.created_at',
            'message.updated_at',
            sql<{
              author_id: number;
              first_name: string;
              last_name: string;
              user_id: string;
            }>`JSON_BUILD_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id)`.as(
              'author'
            ),
          ])
          .innerJoin('author', 'author.author_id', 'message.author_id')
          .orderBy('client_message_id', input.orderBy || 'desc')
          .execute();

        return {
          messages: messages || [],
          next_cursor:
            Math.min(...messages.map((m) => m.client_message_id)) || 0,
        };
      } catch (e) {
        return {
          messages: [],
          next_cursor: 0,
        };
      }
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
      const insertedMessage = await ctx.db
        .insertInto('message')
        .values((eb) => ({
          text: input.text,
          type: MessageType.MESSAGE,
          status: MessageStatus.SENT,
          visibility: MessageVisibility.ALL,
          content: input.content,
          author_id: eb
            .selectFrom('author')
            .select('author_id')
            .where('author.user_id', '=', ctx.auth.userId),
          chatroom_id: input.chatroomId,
          updated_at: dayjs.utc().toISOString(),
        }))
        .returning('client_message_id')
        .executeTakeFirst();

      const message = await ctx.db
        .selectFrom('message')
        .select([
          'client_message_id',
          'text',
          'message.created_at',
          'message.updated_at',
          'content',
          sql<{
            first_name: string;
            last_name: string;
            author_id: number;
            user_id: string;
          }>`JSON_BUILD_OBJECT('first_name',author.first_name, 'last_name', author.last_name, 'email', author.email, 'author_id', author.author_id, 'role', author.role, 'user_id', author.user_id)`.as(
            'author'
          ),
        ])
        .innerJoin('author', 'author.author_id', 'message.author_id')
        .where(
          'client_message_id',
          '=',
          insertedMessage?.client_message_id as unknown as number
        )
        .executeTakeFirst();

      await ablyRest.channels
        .get(ablyChannelKeyStore.chatroom(input.chatroomId))
        .publish('message', message);

      return message;
    }),
  editMessage: protectedProcedure
    .input(
      z.object({
        clientMessageId: z.number(),
        text: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const author = await ctx.db
        .selectFrom('author')
        .selectAll()
        .where(({ cmpr }) => cmpr('user_id', '=', ctx.auth.userId))
        .executeTakeFirst();

      if (!author) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Error finding author',
        });
      }

      await ctx.db.transaction().execute(async (trx) => {
        await trx
          .updateTable('message')
          .set({
            text: input.text,
            content: input.content,
            updated_at: dayjs.utc().toDate(),
          })
          .where(({ cmpr, and }) =>
            and([
              cmpr('client_message_id', '=', input.clientMessageId),
              cmpr('author_id', '=', author.author_id),
            ])
          )
          .execute();
      });
    }),
});
