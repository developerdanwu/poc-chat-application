create sequence "public"."MessageRecepient_id_seq";

alter table "public"."chatroom" drop constraint "chatroom_last_unread_client_message_id_fkey";

alter table "public"."message" drop constraint "message_author_id_fkey";

drop index if exists "public"."chatroom_last_unread_client_message_id_key";

create table "public"."MessageRecepient" (
    "id" integer not null default nextval('"MessageRecepient_id_seq"'::regclass),
    "author_id" integer not null,
    "message_id" integer not null,
    "status" "MessageStatus" not null
);


alter table "public"."chatroom" drop column "last_unread_client_message_id";

alter table "public"."message" drop column "status";

alter sequence "public"."MessageRecepient_id_seq" owned by "public"."MessageRecepient"."id";

CREATE UNIQUE INDEX "MessageRecepient_pkey" ON public."MessageRecepient" USING btree (id);

alter table "public"."MessageRecepient" add constraint "MessageRecepient_pkey" PRIMARY KEY using index "MessageRecepient_pkey";

alter table "public"."MessageRecepient" add constraint "MessageRecepient_author_id_fkey" FOREIGN KEY (author_id) REFERENCES author(author_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."MessageRecepient" validate constraint "MessageRecepient_author_id_fkey";

alter table "public"."MessageRecepient" add constraint "MessageRecepient_message_id_fkey" FOREIGN KEY (message_id) REFERENCES message(client_message_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."MessageRecepient" validate constraint "MessageRecepient_message_id_fkey";


