import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ChatGPTAPI } from "chatgpt";
import { env } from "@/env.mjs";

const gpt = new ChatGPTAPI({
  apiKey: env.OPENAI_ACCESS_TOKEN as string,
});

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
            userId: ctx.auth?.userId,
          },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            userId: true,
          },
        },
        messages: {
          select: {
            message: true,
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
      })
    )
    .query(async ({ ctx, input }) => {
      const chatroom = await ctx.prisma.chatroom
        .findUnique({
          where: {
            id: input.chatroomId,
          },
          include: {
            _count: true,
            messages: {
              include: {
                aiUserSender: {
                  select: {
                    id: true,
                    name: true,
                    created: true,
                  },
                },
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
  sendMessageToAi: protectedProcedure
    .input(
      z.object({
        textPrompt: z.string().min(1),
        chatroomId: z.string().min(1),
        // TODO: add Ai model
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.message.create({
          data: {
            message: input.textPrompt,
            chatroomId: input.chatroomId,
            senderId: ctx.auth.userId,
          },
        });
        const aiResponse = await gpt.sendMessage(input.textPrompt);
        await ctx.prisma.message.create({
          data: {
            message: input.textPrompt,
            chatroomId: input.chatroomId,
            senderId: ctx.auth.userId,
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
