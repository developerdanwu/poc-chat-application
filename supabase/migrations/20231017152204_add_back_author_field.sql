alter table "public"."message" add column "author_id" integer not null;

alter table "public"."message" add constraint "message_author_id_fkey" FOREIGN KEY (author_id) REFERENCES author(author_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."message" validate constraint "message_author_id_fkey";


