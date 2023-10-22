import { createTRPCRouter } from '@/server/api/trpc';
import getMessages from '@/server/api/routers/messaging/procedures/getMessages';
import sendMessage from '@/server/api/routers/messaging/procedures/sendMessage';
import getMessagesCount from '@/server/api/routers/messaging/procedures/getTotalMessages';
import readAllMessages from '@/server/api/routers/messaging/procedures/readAllMessages';
import unreadMessages from '@/server/api/routers/messaging/procedures/unreadMessages';

export const messaging = createTRPCRouter({
  getMessages,
  sendMessage,
  readAllMessages,
  getMessagesCount,
  unreadMessages,
});
