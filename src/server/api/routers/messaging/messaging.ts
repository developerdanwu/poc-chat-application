import { createTRPCRouter } from '@/server/api/trpc';
import { env } from '@/env.mjs';
import getMessages from '@/server/api/routers/messaging/procedures/getMessages';
import sendMessage from '@/server/api/routers/messaging/procedures/sendMessage';
import editMessage from '@/server/api/routers/messaging/procedures/editMessage';
import { ChatOpenAI } from 'langchain/chat_models';

const openaiApi = new ChatOpenAI({
  openAIApiKey: env.OPENAI_ACCESS_TOKEN,
  temperature: 0.9,
});

export const messaging = createTRPCRouter({
  getMessages,
  sendMessage,
  editMessage,
});
