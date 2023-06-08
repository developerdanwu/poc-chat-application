-- CreateEnum
CREATE TYPE "ChatroomSubtype" AS ENUM ('OPENAI_CHATROOM', 'DEFAULT');

-- AlterTable
ALTER TABLE "chatroom" ADD COLUMN     "subtype" "ChatroomSubtype" NOT NULL DEFAULT 'DEFAULT',
ALTER COLUMN "type" SET DEFAULT 'HUMAN_CHATROOM';
