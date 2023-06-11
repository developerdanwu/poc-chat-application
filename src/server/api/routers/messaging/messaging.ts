import { createTRPCRouter } from '@/server/api/trpc';
import { ChatGPTAPI } from 'chatgpt';
import { env } from '@/env.mjs';
import getMessages from '@/server/api/routers/messaging/procedures/getMessages';
import sendMessage from '@/server/api/routers/messaging/procedures/sendMessage';
import editMessage from '@/server/api/routers/messaging/procedures/editMessage';

const gpt = new ChatGPTAPI({
  apiKey: env.OPENAI_ACCESS_TOKEN as string,
});

export const messaging = createTRPCRouter({
  getMessages,
  sendMessage,
  editMessage,
});
