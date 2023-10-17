create sequence "public"."message_recepient_id_seq";

alter table "public"."MessageRecepient" drop constraint "MessageRecepient_message_id_fkey";

alter table "public"."MessageRecepient" drop constraint "MessageRecepient_recepient_id_fkey";

alter table "public"."MessageRecepient" drop constraint "MessageRecepient_pkey";

drop index if exists "public"."MessageRecepient_pkey";

drop index if exists "public"."message_author_id_idx";

drop table "public"."MessageRecepient";

create table "public"."message_recepient" (
    "id" integer not null default nextval('message_recepient_id_seq'::regclass),
    "recepient_id" integer not null,
    "message_id" integer not null,
    "status" "MessageStatus" not null
);


alter table "public"."message" drop column "author_id";

alter sequence "public"."message_recepient_id_seq" owned by "public"."message_recepient"."id";

drop sequence if exists "public"."MessageRecepient_id_seq";

CREATE UNIQUE INDEX message_recepient_pkey ON public.message_recepient USING btree (id);

alter table "public"."message_recepient" add constraint "message_recepient_pkey" PRIMARY KEY using index "message_recepient_pkey";

alter table "public"."message_recepient" add constraint "message_recepient_message_id_fkey" FOREIGN KEY (message_id) REFERENCES message(client_message_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."message_recepient" validate constraint "message_recepient_message_id_fkey";

alter table "public"."message_recepient" add constraint "message_recepient_recepient_id_fkey" FOREIGN KEY (recepient_id) REFERENCES author(author_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."message_recepient" validate constraint "message_recepient_recepient_id_fkey";


