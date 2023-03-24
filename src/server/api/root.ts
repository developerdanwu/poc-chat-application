import { createTRPCRouter } from "@/server/api/trpc";
import { chatGpt } from "@/server/api/routers/chatGpt";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  chatGpt,
});

// export type definition of API
export type AppRouter = typeof appRouter;
