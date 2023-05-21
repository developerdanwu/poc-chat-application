import type { ColumnType } from 'kysely';
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;
export type MessageType = 'MESSAGE' | 'AI_RESPONSE';
export const MessageType = {
  MESSAGE: 'MESSAGE',
  AI_RESPONSE: 'AI_RESPONSE',
};
export type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export const MessageStatus = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
};
export type MessageVisibility = 'ME' | 'ALL';
export const MessageVisibility = {
  ME: 'ME',
  ALL: 'ALL',
};
export type Author = {
  first_name: string;
  last_name: string;
  email: string | null;
  author_id: Generated<number>;
  role: string;
  user_id: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
};
export type AuthorsOnChatrooms = {
  author_id: number;
  chatroom_id: string;
};
export type Chatroom = {
  id: Generated<string>;
  no_of_users: number;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
};
export type Message = {
  client_message_id: Generated<number>;
  text: string;
  type: MessageType;
  content: string;
  author_id: number;
  chatroom_id: string;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
  status: MessageStatus;
  visibility: MessageVisibility;
};
export type DB = {
  author: Author;
  _authors_on_chatrooms: AuthorsOnChatrooms;
  chatroom: Chatroom;
  message: Message;
};
