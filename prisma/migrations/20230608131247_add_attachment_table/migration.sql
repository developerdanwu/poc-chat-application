/*
  Warnings:

  - The values [AI_RESPONSE] on the enum `MessageType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('OPENAI_RESPONSE');

-- AlterEnum
BEGIN;
CREATE TYPE "MessageType_new" AS ENUM ('MESSAGE');
ALTER TABLE "message" ALTER COLUMN "type" TYPE "MessageType_new" USING ("type"::text::"MessageType_new");
ALTER TYPE "MessageType" RENAME TO "MessageType_old";
ALTER TYPE "MessageType_new" RENAME TO "MessageType";
DROP TYPE "MessageType_old";
COMMIT;

-- CreateTable
CREATE TABLE "Attachment" (
    "attachment_id" SERIAL NOT NULL,
    "message_client_message_id" INTEGER NOT NULL,
    "type" "AttachmentType" NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("attachment_id")
);

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_message_client_message_id_fkey" FOREIGN KEY ("message_client_message_id") REFERENCES "message"("client_message_id") ON DELETE RESTRICT ON UPDATE CASCADE;
