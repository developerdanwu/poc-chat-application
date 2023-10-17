alter table "public"."MessageRecepient" drop constraint "MessageRecepient_author_id_fkey";

alter table "public"."MessageRecepient" drop column "author_id";

alter table "public"."MessageRecepient" add column "recepient_id" integer not null;

alter table "public"."MessageRecepient" add constraint "MessageRecepient_recepient_id_fkey" FOREIGN KEY (recepient_id) REFERENCES author(author_id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."MessageRecepient" validate constraint "MessageRecepient_recepient_id_fkey";


