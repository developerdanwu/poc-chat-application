import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const messaging = createTRPCRouter({
  getUserId: protectedProcedure.query(({ ctx }) => {
    return {
      secret: `${ctx.auth?.userId} is using a protected prodedure`,
    };
  }),
  getMessages: protectedProcedure.query(async ({ ctx }) => {
    const all = ctx.prisma.chatroom.findUnique({
      where: {
        id: "clfpepzy10000e6rgzrnq8ggc",
      },
      select: {
        _count: true,
        messages: true,
      },
    });
    return all;
  }),
});
