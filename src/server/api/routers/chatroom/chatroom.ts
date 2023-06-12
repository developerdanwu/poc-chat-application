import { createTRPCRouter } from '@/server/api/trpc';
import getOwnAuthor from '@/server/api/routers/chatroom/procedures/getOwnAuthor';
import startAiChat from '@/server/api/routers/chatroom/procedures/startAiChat';
import guessChatroomFromAuthors from '@/server/api/routers/chatroom/procedures/guessChatroomFromAuthors';
import getAllHumanAuthors from '@/server/api/routers/chatroom/procedures/getAllHumanAuthors';
import startNewChat from '@/server/api/routers/chatroom/procedures/startNewChat';
import getAiChatrooms from '@/server/api/routers/chatroom/procedures/getAiChatrooms';
import getChatrooms from '@/server/api/routers/chatroom/procedures/getChatrooms';
import getChatroom from '@/server/api/routers/chatroom/procedures/getChatroom';
import createNewChatBranch from '@/server/api/routers/chatroom/procedures/createNewChatBranch';
import deleteChatroomSoft from '@/server/api/routers/chatroom/procedures/deleteChatroomSoft';

export const chatroom = createTRPCRouter({
  deleteChatroomSoft,
  createNewChatBranch,
  getOwnAuthor,
  startAiChat,
  guessChatroomFromAuthors,
  getAllHumanAuthors,
  startNewChat,
  getAiChatrooms,
  getChatrooms,
  getChatroom,
});
