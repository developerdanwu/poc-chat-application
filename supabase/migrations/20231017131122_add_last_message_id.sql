alter type "public"."MessageStatus" rename to "MessageStatus__old_version_to_be_dropped";

create type "public"."MessageStatus" as enum ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

alter table "public"."message" alter column status type "public"."MessageStatus" using status::text::"public"."MessageStatus";

drop type "public"."MessageStatus__old_version_to_be_dropped";

alter table "public"."chatroom" add column "last_unread_client_message_id" integer;

CREATE UNIQUE INDEX chatroom_last_unread_client_message_id_key ON public.chatroom USING btree (last_unread_client_message_id);

alter table "public"."chatroom" add constraint "chatroom_last_unread_client_message_id_fkey" FOREIGN KEY (last_unread_client_message_id) REFERENCES message(client_message_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."chatroom" validate constraint "chatroom_last_unread_client_message_id_fkey";


