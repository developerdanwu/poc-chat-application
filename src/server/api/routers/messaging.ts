import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ChatGPTAPI } from "chatgpt";
import { env } from "@/env.mjs";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";

const gpt = new ChatGPTAPI({
  apiKey: env.OPENAI_ACCESS_TOKEN as string,
});

class MyEventEmitter extends EventEmitter {}

// In a real app, you'd probably use Redis or something
const ee = new MyEventEmitter();

export const messaging = createTRPCRouter({
  getUserId: protectedProcedure.query(({ ctx }) => {
    return {
      secret: `${ctx.auth?.userId} is using a protected prodedure`,
    };
  }),
  getAllChatrooms: protectedProcedure.query(async ({ ctx }) => {
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
        messages: {
          select: {
            text: true,
          },
        },
      },
    });
    return chatrooms;
  }),
  getMessages: protectedProcedure
    .input(
      z.object({
        chatroomId: z.string().min(1),
        orderBy: z.enum(["asc", "desc"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const chatroom = await ctx.prisma.chatroom
        .findUnique({
          where: {
            id: input.chatroomId,
          },
          include: {
            messages: {
              select: {
                author: true,
                clientMessageId: true,
                text: true,
                content: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        })
        .catch((e) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred, please try again later.",
            cause: e,
          });
        });

      if (chatroom) {
        return chatroom;
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
        const author = await ctx.prisma.author.upsert({
          where: {
            userId: ctx.auth.userId,
          },
          create: {
            userId: ctx.auth.userId,
            role: "user",
          },
          update: {},
        });
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
        ee.emit("onMessage", message);
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred, please try again later.",
          cause: e,
        });
      }
    }),
  onNewMessage: publicProcedure.subscription(() => {
    return observable((emit) => {
      const onMessage = (data: any) => emit.next(data);
      ee.on("onMessage", onMessage);
      return () => {
        ee.off("onMessage", onMessage);
      };
    });
  }),
});
