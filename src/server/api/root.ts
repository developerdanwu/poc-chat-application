import {createTRPCRouter} from '@/server/api/trpc';
import {chatGpt} from '@/server/api/routers/chatGpt';
import {openai} from '@/server/api/routers/openai';
import {messaging} from '@/server/api/routers/messaging/messaging';
import {type inferRouterInputs, type inferRouterOutputs} from '@trpc/server';
import {ably} from '@/server/api/routers/ably';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  chatGpt,
  openai,
  messaging,
  ably,
});

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

// export type definition of API
export type AppRouter = typeof appRouter;
