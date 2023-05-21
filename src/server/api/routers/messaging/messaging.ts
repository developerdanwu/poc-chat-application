import { createTRPCRouter } from '@/server/api/trpc';
import { ChatGPTAPI } from 'chatgpt';
import { env } from '@/env.mjs';
import startNewChat from '@/server/api/routers/messaging/procedures/startNewChat';
import getAllAuthors from '@/server/api/routers/messaging/procedures/getAllAuthors';
import getChatrooms from '@/server/api/routers/messaging/procedures/getChatrooms';
import getChatroom from '@/server/api/routers/messaging/procedures/getChatroom';
import getMessages from '@/server/api/routers/messaging/procedures/getMessages';
import sendMessage from '@/server/api/routers/messaging/procedures/sendMessage';
import editMessage from '@/server/api/routers/messaging/procedures/editMessage';

const gpt = new ChatGPTAPI({
  apiKey: env.OPENAI_ACCESS_TOKEN as string,
});

export const messaging = createTRPCRouter({
  getAllAuthors,
  startNewChat,
  // TODO: improve database searching
  getChatrooms,
  getChatroom,
  getMessages,
  sendMessage,
  editMessage,
});
