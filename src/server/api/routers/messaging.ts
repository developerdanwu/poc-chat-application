import {
  ablyRest,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ChatGPTAPI } from "chatgpt";
import { env } from "@/env.mjs";
import { clerkClient } from "@clerk/nextjs/api";
import { notEmpty } from "@/utils/ts-utils";
import { ablyChannelKeyStore } from "@/utils/useAblyWebsocket";
import { getFullName } from "@/utils/utils";

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
      clerkClient.users.getUserList({});
      const results = await ctx.prisma.author.findMany({
        where: {
          userId: {
            not: ctx.auth.userId,
          },
        },
      });
      return results;
    }),
  startNewChat: protectedProcedure
    .input(
      z.object({
        authorId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetAuthor = await ctx.prisma.author.findUnique({
        where: {
          authorId: input.authorId,
        },
        include: {
          chatrooms: {
            where: {
              users: {
                some: {
                  userId: ctx.auth.userId,
                },
              },
            },
          },
        },
      });

      // todo check if there are more than 1 author for group chat
      if (targetAuthor?.chatrooms.length === 1) {
        return targetAuthor.chatrooms[0]!.id;
      }
      const newChatroom = await ctx.prisma.chatroom.create({
        data: {
          users: {
            connect: [
              {
                authorId: input.authorId,
              },
              {
                userId: ctx.auth.userId,
              },
            ],
          },
        },
      });

      return newChatroom.id;
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
      const chatrooms = await ctx.prisma.chatroom.findMany({
        where: {
          users: {
            some: {
              userId: ctx.auth.userId,
            },
          },
        },
        include: {
          users: {
            select: {
              authorId: true,
              userId: true,
            },
          },
        },
      });

      const authors = chatrooms.map((chatroom) => {
        return chatroom.users.map((author) => author.userId).filter(notEmpty);
      });

      const users = await clerkClient.users.getUserList({
        userId: authors.flat(),
      });

      return chatrooms
        .map((chatroom) => {
          return {
            ...chatroom,
            users: chatroom.users.map((author) => {
              const user = users.find((user) => user.id === author.userId);
              return {
                ...author,
                firstName: user?.firstName,
                lastName: user?.lastName,
                emailAddresses: user?.emailAddresses,
              };
            }),
          };
        })
        .filter((chatroom) =>
          chatroom.users.some((author) => {
            return getFullName({
              firstName: author.firstName,
              lastName: author.lastName,
              fallback: "",
            })
              .toLowerCase()
              .includes(input?.searchKeyword?.toLowerCase() ?? "");
          })
        );
    }),
  getChatroom: protectedProcedure
    .input(
      z.object({
        chatroomId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const chatroom = await ctx.prisma.chatroom.findUnique({
        where: {
          id: input.chatroomId,
        },
        include: {
          users: {
            select: {
              authorId: true,
              userId: true,
            },
          },
        },
      });

      if (chatroom) {
        const authors = chatroom.users
          .map((author) => author.userId)
          .filter(notEmpty);

        const users = await clerkClient.users.getUserList({
          userId: authors,
        });

        return {
          ...chatroom,
          users: chatroom.users.map((author) => {
            const user = users.find((user) => user.id === author.userId);
            return {
              ...author,
              firstName: user?.firstName,
              lastName: user?.lastName,
              emailAddresses: user?.emailAddresses,
            };
          }),
        };
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Chatroom not found",
      });
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
        content: z.any(),
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
