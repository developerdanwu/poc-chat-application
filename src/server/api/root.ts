import { createTRPCRouter } from "@/server/api/trpc";
import { chatGpt } from "@/server/api/routers/chatGpt";
import { openai } from "@/server/api/routers/openai";
import { messaging } from "@/server/api/routers/messaging";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  chatGpt,
  openai,
  messaging,
});

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

// export type definition of API
export type AppRouter = typeof appRouter;
