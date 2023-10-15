import { createTRPCRouter } from '@/server/api/trpc';
import getMessages from '@/server/api/routers/messaging/procedures/getMessages';
import sendMessage from '@/server/api/routers/messaging/procedures/sendMessage';
import getMessagesCount from '@/server/api/routers/messaging/procedures/getTotalMessages';

export const messaging = createTRPCRouter({
  getMessages,
  sendMessage,

  getMessagesCount,
});
