import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const messaging = createTRPCRouter({
  getUserId: protectedProcedure.query(async ({ ctx }) => {
    return {
      secret: `${ctx.auth?.userId} is using a protected prodedure`,
    };
  }),
});
