alter table "public"."message_recepient" add column "created_at" timestamp(3) with time zone not null default CURRENT_TIMESTAMP;

alter table "public"."message_recepient" add column "updated_at" timestamp(3) with time zone not null;


