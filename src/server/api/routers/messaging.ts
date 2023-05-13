import {
  ablyRest,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ChatGPTAPI } from "chatgpt";
import { env } from "@/env.mjs";
import { ablyChannelKeyStore } from "@/utils/useAblyWebsocket";
import { sql } from "kysely";
import { v4 as uuid } from "uuid";

const gpt = new ChatGPTAPI({
  apiKey: env.OPENAI_ACCESS_TOKEN as string,
});

// In a real app, you'd probably use Redis or something

export const messaging = createTRPCRouter({
  getAllAuthors: protectedProcedure
    .input(
      z.object({
        searchKeyword: z.string().optional(),
      })
    )
    .query(async ({ ctx }) => {
      const results = await ctx.db
        .selectFrom("author")
        .select(["author.author_id", "author.first_name", "author.last_name"])
        .where("author.user_id", "!=", ctx.auth.userId)
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
        .selectFrom("chatroom")
        .select([
          "id",
          sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
            "user_count"
          ),
          sql<
            { author_id: number }[]
          >`JSON_ARRAYAGG(JSON_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
            "authors"
          ),
        ])
        .innerJoin(
          "_authors_on_chatrooms",
          "_authors_on_chatrooms.chatroom_id",
          "chatroom.id"
        )
        .innerJoin(
          "author",
          "author.author_id",
          "_authors_on_chatrooms.author_id"
        )
        .where(({ cmpr, or }) =>
          or([
            cmpr("author.author_id", "=", input.authorId),
            cmpr("author.user_id", "=", ctx.auth.userId),
          ])
        )
        .groupBy("id")
        // @ts-expect-error idk why this is happening
        .having((eb) => eb.cmpr("user_count", "=", 2))
        .execute();

      if (chatroom.length > 1) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "More than one chatroom found",
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
            .insertInto("chatroom")
            .values({
              no_of_users: 2,
              updated_at: new Date(),
              id: newChatroomId,
            })
            .execute();

          // add author to chatroom
          await trx
            .insertInto("_authors_on_chatrooms")
            .values((eb) => [
              {
                author_id: eb
                  .selectFrom("author")
                  .select("author_id")
                  .where("author.user_id", "=", ctx.auth.userId),
                chatroom_id: newChatroomId,
              },
              {
                author_id: input.authorId,
                chatroom_id: newChatroomId,
              },
            ])
            .execute();

          // create new message
          const clientMessageId = uuid();
          await trx
            .insertInto("message")
            .values((eb) => ({
              client_message_id: clientMessageId,
              text: input.text,
              type: "text",
              content: input.content,
              author_id: eb
                .selectFrom("author")
                .select("author_id")
                .where("author.user_id", "=", ctx.auth.userId),
              chatroom_id: newChatroomId,
              updated_at: new Date(),
            }))
            .execute();

          // id is unique so must only return 1
          // get chatrooms
          const chatroom = await ctx.db
            .selectFrom("chatroom")
            .select([
              "id",
              sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
                "user_count"
              ),
              sql<
                { author_id: number }[]
              >`JSON_ARRAYAGG(JSON_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
                "authors"
              ),
            ])
            .innerJoin(
              "_authors_on_chatrooms",
              "_authors_on_chatrooms.chatroom_id",
              "chatroom.id"
            )
            .innerJoin(
              "author",
              "author.author_id",
              "_authors_on_chatrooms.author_id"
            )
            .where(({ cmpr }) => cmpr("chatroom.id", "=", newChatroomId))
            .groupBy("id")
            .execute();

          if (chatroom.length > 1) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Error creating chatroom",
            });
          }

          // if no chatroom throw error
          if (!chatroom[0]) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Error finding chatroom",
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
      const test = await ctx.db
        .selectFrom("chatroom")
        .select(["chatroom.id", "chatroom.no_of_users"])
        .leftJoin(
          "_authors_on_chatrooms",
          "_authors_on_chatrooms.chatroom_id",
          "chatroom.id"
        )
        .leftJoin(
          "author",
          "author.author_id",
          "_authors_on_chatrooms.author_id"
        )
        .select(["author.author_id", "author.first_name", "author.last_name"])
        .execute();
      // const chatrooms = await ctx.prisma.chatroom.findMany({
      //   where: {
      //     users: {
      //       some: {
      //         userId: ctx.auth.userId,
      //       },
      //     },
      //   },
      //   include: {
      //     users: {
      //       select: {
      //         authorId: true,
      //         userId: true,
      //       },
      //     },
      //   },
      // });
      //
      // const authors = chatrooms.map((chatroom) => {
      //   return chatroom.users.map((author) => author.userId).filter(notEmpty);
      // });
      //
      // const users = await clerkClient.users.getUserList({
      //   userId: authors.flat(),
      // });
      //
      // return chatrooms
      //   .map((chatroom) => {
      //     return {
      //       ...chatroom,
      //       users: chatroom.users.map((author) => {
      //         const user = users.find((user) => user.id === author.userId);
      //         return {
      //           ...author,
      //           firstName: user?.firstName,
      //           lastName: user?.lastName,
      //           emailAddresses: user?.emailAddresses,
      //         };
      //       }),
      //     };
      //   })
      //   .filter((chatroom) =>
      //     chatroom.users.some((author) => {
      //       return getFullName({
      //         firstName: author.firstName,
      //         lastName: author.lastName,
      //         fallback: "",
      //       })
      //         .toLowerCase()
      //         .includes(input?.searchKeyword?.toLowerCase() ?? "");
      //     })
      //   );
    }),
  getChatroom: protectedProcedure
    .input(
      z.object({
        chatroomId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const chatroom = await ctx.db
        .selectFrom("chatroom")
        .select([
          "id",
          sql<number>`COUNT(DISTINCT _authors_on_chatrooms.author_id)`.as(
            "user_count"
          ),
          sql<
            {
              author_id: number;
              first_name: string;
              last_name: string;
              user_id: string;
            }[]
          >`JSON_ARRAYAGG(JSON_OBJECT('author_id', author.author_id, 'first_name', author.first_name, 'last_name', author.last_name, 'user_id', author.user_id))`.as(
            "authors"
          ),
        ])
        .innerJoin(
          "_authors_on_chatrooms",
          "_authors_on_chatrooms.chatroom_id",
          "chatroom.id"
        )
        .innerJoin(
          "author",
          "author.author_id",
          "_authors_on_chatrooms.author_id"
        )
        .where(({ cmpr }) => cmpr("id", "=", input.chatroomId))
        .groupBy("id")
        .executeTakeFirst();

      if (!chatroom) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Error finding chatroom",
        });
      }

      return chatroom;
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        chatroomId: z.string().min(1),
        orderBy: z.enum(["asc", "desc"]).optional(),
        cursor: z.string().nullish(),
        skip: z.number().optional(),
        take: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.take || 10;
      try {
        const messages = await ctx.prisma.message
          .findMany({
            where: {
              chatroom: {
                id: input.chatroomId,
              },
            },
            cursor: input.cursor
              ? { clientMessageId: input.cursor }
              : undefined,
            take: limit + 1,
            skip: input.skip || 0,
            orderBy: {
              createdAt: input.orderBy || "desc",
            },
            select: {
              author: true,
              clientMessageId: true,
              text: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          })
          .catch((e) => {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An unexpected error occurred, please try again later.",
              cause: e,
            });
          });
        if (messages) {
          let nextCursor: string | undefined = undefined;
          if (messages.length > limit) {
            const nextItem = messages.pop();
            nextCursor = nextItem!.clientMessageId;
          }

          return { messages, nextCursor };
        }
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred, please try again later.",
          cause: e,
        });
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `unable to locate chatroom with provided id of ${input.chatroomId}`,
      });
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
      try {
        const author = await ctx.prisma.author.findUnique({
          where: {
            userId: ctx.auth.userId,
          },
        });

        if (!author) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred, please try again later.",
            cause: "author not found",
          });
        }
        const message = await ctx.prisma.message.create({
          data: {
            type: "message",
            content: input.content,
            text: input.text,
            chatroom: { connect: { id: input.chatroomId } },
            author: {
              connect: { authorId: author.authorId },
            },
          },
        });
        const channel = ablyRest.channels.get(
          ablyChannelKeyStore.chatroom(input.chatroomId)
        );

        channel.publish("message", {
          clientMessageId: message.clientMessageId,
          text: message.text,
          content: message.content,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          author: {
            authorId: message.authorId,
            userId: author.userId,
            role: "user",
            createdAt: author.createdAt,
            updatedAt: author.updatedAt,
            firstName: author.firstName,
            lastName: author.lastName,
          },
        });
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred, please try again later.",
          cause: e,
        });
      }
    }),
});
