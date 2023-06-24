import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface _AuthorsOnChatrooms {
  author_id: number;
  chatroom_id: string;
}

export interface _PrismaMigrations {
  id: string;
  checksum: string;
  finished_at: Timestamp | null;
  migration_name: string;
  logs: string | null;
  rolled_back_at: Timestamp | null;
  started_at: Generated<Timestamp>;
  applied_steps_count: Generated<number>;
}

export interface AiSettings {
  id: Generated<number>;
  model: "OPENAI";
  author_id: number;
  open_ai_settings_id: number | null;
  chatroom_id: string;
}

export interface Attachment {
  attachment_id: Generated<number>;
  message_client_message_id: number;
  type: "OPENAI_RESPONSE";
}

export interface Author {
  first_name: string;
  last_name: string;
  email: string | null;
  author_id: Generated<number>;
  role: "AI" | "USER";
  user_id: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
  human_user_id: number | null;
}

export interface Chatroom {
  id: Generated<string>;
  type: Generated<"AI_CHATROOM" | "CHATROOM_BRANCH" | "HUMAN_CHATROOM">;
  subtype: Generated<"DEFAULT" | "OPENAI_CHATROOM">;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
  chatroom_branch_id: string | null;
  status: Generated<"ACTIVE" | "DELETED">;
}

export interface Message {
  client_message_id: Generated<number>;
  text: string;
  type: "MESSAGE";
  content: string;
  author_id: number;
  chatroom_id: string;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
  is_edited: Generated<boolean>;
  status: "DELIVERED" | "FAILED" | "QUEUED" | "READ" | "SENT";
  visibility: "ALL" | "ME";
}

export interface OpenAiSettings {
  id: Generated<number>;
  temperature: Generated<number | null>;
}

export interface SlackChatroom {
  slack_chatroom_id: string;
  conversationSummary: string;
}

export interface SlackMessage {
  id: Generated<number>;
  slack_chatroom_id: string;
  text: string;
  embedding: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Timestamp;
}

export interface DB {
  _authors_on_chatrooms: _AuthorsOnChatrooms;
  _prisma_migrations: _PrismaMigrations;
  ai_settings: AiSettings;
  attachment: Attachment;
  author: Author;
  chatroom: Chatroom;
  message: Message;
  open_ai_settings: OpenAiSettings;
  slack_chatroom: SlackChatroom;
  slack_message: SlackMessage;
}
