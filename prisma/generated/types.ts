import type { ColumnType } from 'kysely';
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const ChatroomStatus = {
  ACTIVE: 'ACTIVE',
  DELETED: 'DELETED',
} as const;
export type ChatroomStatus =
  (typeof ChatroomStatus)[keyof typeof ChatroomStatus];
export const ChatroomSubtype = {
  OPENAI_CHATROOM: 'OPENAI_CHATROOM',
  DEFAULT: 'DEFAULT',
} as const;
export type ChatroomSubtype =
  (typeof ChatroomSubtype)[keyof typeof ChatroomSubtype];
export const ChatroomType = {
  HUMAN_CHATROOM: 'HUMAN_CHATROOM',
  AI_CHATROOM: 'AI_CHATROOM',
  CHATROOM_BRANCH: 'CHATROOM_BRANCH',
} as const;
export type ChatroomType = (typeof ChatroomType)[keyof typeof ChatroomType];
export const MessageType = {
  MESSAGE: 'MESSAGE',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];
export const MessageStatus = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  READ: 'READ',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];
export const MessageVisibility = {
  ME: 'ME',
  ALL: 'ALL',
} as const;
export type MessageVisibility =
  (typeof MessageVisibility)[keyof typeof MessageVisibility];
export const Role = {
  USER: 'USER',
  AI: 'AI',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const AiModel = {
  OPENAI: 'OPENAI',
} as const;
export type AiModel = (typeof AiModel)[keyof typeof AiModel];
export const AttachmentType = {
  OPENAI_RESPONSE: 'OPENAI_RESPONSE',
} as const;
export type AttachmentType =
  (typeof AttachmentType)[keyof typeof AttachmentType];
export type AiSettings = {
  id: Generated<number>;
  model: AiModel;
  author_id: number;
  open_ai_settings_id: number | null;
  chatroom_id: string;
};
export type Attachment = {
  attachment_id: Generated<number>;
  message_client_message_id: number;
  type: AttachmentType;
};
export type Author = {
  first_name: string;
  last_name: string;
  email: string | null;
  author_id: Generated<number>;
  role: Role;
  user_id: string;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
  human_user_id: number | null;
};
export type AuthorsOnChatrooms = {
  author_id: number;
  chatroom_id: string;
};
export type Chatroom = {
  id: Generated<string>;
  type: Generated<ChatroomType>;
  subtype: Generated<ChatroomSubtype>;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
  chatroom_branch_id: string | null;
  status: Generated<ChatroomStatus>;
};
export type Message = {
  client_message_id: Generated<number>;
  message_checksum: string;
  text: string;
  type: MessageType;
  content: string;
  chatroom_id: string;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
  is_edited: Generated<boolean>;
  visibility: MessageVisibility;
  author_id: number;
};
export type MessageRecepient = {
  id: Generated<number>;
  recepient_id: number;
  message_id: number;
  status: MessageStatus;
};
export type OpenAiSettings = {
  id: Generated<number>;
  temperature: Generated<number | null>;
};
export type SlackChatroom = {
  slack_chatroom_id: string;
  conversationSummary: string;
};
export type SlackMessage = {
  id: Generated<number>;
  slack_chatroom_id: string;
  text: string;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
};
export type DB = {
  _authors_on_chatrooms: AuthorsOnChatrooms;
  ai_settings: AiSettings;
  attachment: Attachment;
  author: Author;
  chatroom: Chatroom;
  message: Message;
  message_recepient: MessageRecepient;
  open_ai_settings: OpenAiSettings;
  slack_chatroom: SlackChatroom;
  slack_message: SlackMessage;
};
