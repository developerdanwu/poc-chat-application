create extension if not exists "vector" with schema "extensions";


create type "public"."AiModel" as enum ('OPENAI');

create type "public"."AttachmentType" as enum ('OPENAI_RESPONSE');

create type "public"."ChatroomStatus" as enum ('ACTIVE', 'DELETED');

create type "public"."ChatroomSubtype" as enum ('OPENAI_CHATROOM', 'DEFAULT');

create type "public"."ChatroomType" as enum ('HUMAN_CHATROOM', 'AI_CHATROOM', 'CHATROOM_BRANCH');

create type "public"."MessageStatus" as enum ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

create type "public"."MessageType" as enum ('MESSAGE');

create type "public"."MessageVisibility" as enum ('ME', 'ALL');

create type "public"."Role" as enum ('USER', 'AI');

create sequence "public"."ai_settings_id_seq";

create sequence "public"."attachment_attachment_id_seq";

create sequence "public"."author_author_id_seq";

create sequence "public"."message_client_message_id_seq";

create sequence "public"."open_ai_settings_id_seq";

create sequence "public"."slack_message_id_seq";

create table "public"."_authors_on_chatrooms" (
    "author_id" integer not null,
    "chatroom_id" text not null
);


create table "public"."ai_settings" (
    "id" integer not null default nextval('ai_settings_id_seq'::regclass),
    "model" "AiModel" not null,
    "author_id" integer not null,
    "open_ai_settings_id" integer,
    "chatroom_id" text not null
);


create table "public"."attachment" (
    "attachment_id" integer not null default nextval('attachment_attachment_id_seq'::regclass),
    "message_client_message_id" integer not null,
    "type" "AttachmentType" not null
);


create table "public"."author" (
    "first_name" text not null,
    "last_name" text not null,
    "email" text,
    "author_id" integer not null default nextval('author_author_id_seq'::regclass),
    "role" "Role" not null,
    "user_id" text,
    "created_at" timestamp(3) with time zone not null default CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) with time zone not null,
    "human_user_id" integer
);


create table "public"."chatroom" (
    "id" text not null default uuid_generate_v4(),
    "type" "ChatroomType" not null default 'HUMAN_CHATROOM'::"ChatroomType",
    "subtype" "ChatroomSubtype" not null default 'DEFAULT'::"ChatroomSubtype",
    "created_at" timestamp(3) with time zone not null default CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) with time zone not null,
    "chatroom_branch_id" text,
    "status" "ChatroomStatus" not null default 'ACTIVE'::"ChatroomStatus"
);


create table "public"."message" (
    "client_message_id" integer not null default nextval('message_client_message_id_seq'::regclass),
    "text" text not null,
    "type" "MessageType" not null,
    "content" text not null,
    "author_id" integer not null,
    "chatroom_id" text not null,
    "created_at" timestamp(3) with time zone not null default CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) with time zone not null,
    "is_edited" boolean not null default false,
    "status" "MessageStatus" not null,
    "visibility" "MessageVisibility" not null
);


create table "public"."open_ai_settings" (
    "id" integer not null default nextval('open_ai_settings_id_seq'::regclass),
    "temperature" double precision default 0
);


create table "public"."slack_chatroom" (
    "slack_chatroom_id" text not null,
    "conversationSummary" text not null
);


create table "public"."slack_message" (
    "id" integer not null default nextval('slack_message_id_seq'::regclass),
    "slack_chatroom_id" text not null,
    "text" text not null,
    "created_at" timestamp(3) with time zone not null default CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) with time zone not null
);


alter sequence "public"."ai_settings_id_seq" owned by "public"."ai_settings"."id";

alter sequence "public"."attachment_attachment_id_seq" owned by "public"."attachment"."attachment_id";

alter sequence "public"."author_author_id_seq" owned by "public"."author"."author_id";

alter sequence "public"."message_client_message_id_seq" owned by "public"."message"."client_message_id";

alter sequence "public"."open_ai_settings_id_seq" owned by "public"."open_ai_settings"."id";

alter sequence "public"."slack_message_id_seq" owned by "public"."slack_message"."id";

CREATE INDEX _authors_on_chatrooms_author_id_idx ON public._authors_on_chatrooms USING btree (author_id);

CREATE INDEX _authors_on_chatrooms_chatroom_id_idx ON public._authors_on_chatrooms USING btree (chatroom_id);

CREATE UNIQUE INDEX _authors_on_chatrooms_pkey ON public._authors_on_chatrooms USING btree (author_id, chatroom_id);

CREATE UNIQUE INDEX ai_settings_author_id_key ON public.ai_settings USING btree (author_id);

CREATE UNIQUE INDEX ai_settings_chatroom_id_key ON public.ai_settings USING btree (chatroom_id);

CREATE UNIQUE INDEX ai_settings_open_ai_settings_id_key ON public.ai_settings USING btree (open_ai_settings_id);

CREATE UNIQUE INDEX ai_settings_pkey ON public.ai_settings USING btree (id);

CREATE UNIQUE INDEX attachment_pkey ON public.attachment USING btree (attachment_id);

CREATE INDEX author_author_id_idx ON public.author USING btree (author_id);

CREATE UNIQUE INDEX author_email_key ON public.author USING btree (email);

CREATE UNIQUE INDEX author_pkey ON public.author USING btree (author_id);

CREATE UNIQUE INDEX author_user_id_key ON public.author USING btree (user_id);

CREATE UNIQUE INDEX chatroom_pkey ON public.chatroom USING btree (id);

CREATE INDEX message_author_id_idx ON public.message USING btree (author_id);

CREATE INDEX message_chatroom_id_idx ON public.message USING btree (chatroom_id);

CREATE UNIQUE INDEX message_pkey ON public.message USING btree (client_message_id);

CREATE UNIQUE INDEX open_ai_settings_pkey ON public.open_ai_settings USING btree (id);

CREATE UNIQUE INDEX slack_chatroom_pkey ON public.slack_chatroom USING btree (slack_chatroom_id);

CREATE UNIQUE INDEX slack_message_pkey ON public.slack_message USING btree (id);

alter table "public"."_authors_on_chatrooms" add constraint "_authors_on_chatrooms_pkey" PRIMARY KEY using index "_authors_on_chatrooms_pkey";

alter table "public"."ai_settings" add constraint "ai_settings_pkey" PRIMARY KEY using index "ai_settings_pkey";

alter table "public"."attachment" add constraint "attachment_pkey" PRIMARY KEY using index "attachment_pkey";

alter table "public"."author" add constraint "author_pkey" PRIMARY KEY using index "author_pkey";

alter table "public"."chatroom" add constraint "chatroom_pkey" PRIMARY KEY using index "chatroom_pkey";

alter table "public"."message" add constraint "message_pkey" PRIMARY KEY using index "message_pkey";

alter table "public"."open_ai_settings" add constraint "open_ai_settings_pkey" PRIMARY KEY using index "open_ai_settings_pkey";

alter table "public"."slack_chatroom" add constraint "slack_chatroom_pkey" PRIMARY KEY using index "slack_chatroom_pkey";

alter table "public"."slack_message" add constraint "slack_message_pkey" PRIMARY KEY using index "slack_message_pkey";

alter table "public"."_authors_on_chatrooms" add constraint "_authors_on_chatrooms_author_id_fkey" FOREIGN KEY (author_id) REFERENCES author(author_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."_authors_on_chatrooms" validate constraint "_authors_on_chatrooms_author_id_fkey";

alter table "public"."_authors_on_chatrooms" add constraint "_authors_on_chatrooms_chatroom_id_fkey" FOREIGN KEY (chatroom_id) REFERENCES chatroom(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."_authors_on_chatrooms" validate constraint "_authors_on_chatrooms_chatroom_id_fkey";

alter table "public"."ai_settings" add constraint "ai_settings_author_id_fkey" FOREIGN KEY (author_id) REFERENCES author(author_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."ai_settings" validate constraint "ai_settings_author_id_fkey";

alter table "public"."ai_settings" add constraint "ai_settings_chatroom_id_fkey" FOREIGN KEY (chatroom_id) REFERENCES chatroom(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."ai_settings" validate constraint "ai_settings_chatroom_id_fkey";

alter table "public"."ai_settings" add constraint "ai_settings_open_ai_settings_id_fkey" FOREIGN KEY (open_ai_settings_id) REFERENCES open_ai_settings(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."ai_settings" validate constraint "ai_settings_open_ai_settings_id_fkey";

alter table "public"."attachment" add constraint "attachment_message_client_message_id_fkey" FOREIGN KEY (message_client_message_id) REFERENCES message(client_message_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."attachment" validate constraint "attachment_message_client_message_id_fkey";

alter table "public"."author" add constraint "author_human_user_id_fkey" FOREIGN KEY (human_user_id) REFERENCES author(author_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."author" validate constraint "author_human_user_id_fkey";

alter table "public"."chatroom" add constraint "chatroom_chatroom_branch_id_fkey" FOREIGN KEY (chatroom_branch_id) REFERENCES chatroom(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."chatroom" validate constraint "chatroom_chatroom_branch_id_fkey";

alter table "public"."message" add constraint "message_author_id_fkey" FOREIGN KEY (author_id) REFERENCES author(author_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."message" validate constraint "message_author_id_fkey";

alter table "public"."message" add constraint "message_chatroom_id_fkey" FOREIGN KEY (chatroom_id) REFERENCES chatroom(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."message" validate constraint "message_chatroom_id_fkey";

alter table "public"."slack_message" add constraint "slack_message_slack_chatroom_id_fkey" FOREIGN KEY (slack_chatroom_id) REFERENCES slack_chatroom(slack_chatroom_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."slack_message" validate constraint "slack_message_slack_chatroom_id_fkey";


