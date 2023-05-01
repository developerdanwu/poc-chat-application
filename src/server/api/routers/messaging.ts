import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const messaging = createTRPCRouter({
  getUserId: protectedProcedure.query(({ ctx }) => {
    return {
      secret: `${ctx.auth?.userId} is using a protected prodedure`,
    };
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
        const t = await ctx.prisma.messages.create({
          data: {
            message: input.textPrompt,
            chatroomId: input.chatroomId,
          },
        });
        console.log(t);
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred, please try again later.",
          cause: e,
        });
      }
    }),
});
