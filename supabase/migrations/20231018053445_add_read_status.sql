alter type "public"."MessageStatus" rename to "MessageStatus__old_version_to_be_dropped";

create type "public"."MessageStatus" as enum ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ');

alter table "public"."message_recepient" alter column status type "public"."MessageStatus" using status::text::"public"."MessageStatus";

drop type "public"."MessageStatus__old_version_to_be_dropped";


