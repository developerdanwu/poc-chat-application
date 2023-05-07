import {
  ablyRest,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
// In a real app, you'd probably use Redis or something

export const ably = createTRPCRouter({
  auth: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const token = await ablyRest.auth.createTokenRequest({
        clientId: ctx.auth.userId,
      });

      return token;
    } catch (e) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: e,
      });
    }
  }),
});
