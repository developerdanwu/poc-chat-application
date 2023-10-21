import {createTRPCRouter} from '@/server/api/trpc';
import {chatGpt} from '@/server/api/routers/chatGpt';
import {openai} from '@/server/api/routers/openai';
import {messaging} from '@/server/api/routers/messaging/messaging';
import {type inferRouterInputs, type inferRouterOutputs} from '@trpc/server';
import {ably} from '@/server/api/routers/ably';
import {chatroom} from '@/server/api/routers/chatroom/chatroom';
import {auth} from '@/server/api/routers/auth/auth';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  chatroom,
  chatGpt,
  openai,
  messaging,
  ably,
  auth,
});

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

// export type definition of API
export type AppRouter = typeof appRouter;
