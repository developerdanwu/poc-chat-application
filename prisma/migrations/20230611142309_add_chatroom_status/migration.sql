-- CreateEnum
CREATE TYPE "ChatroomStatus" AS ENUM ('ACTIVE', 'DELETED');

-- AlterTable
ALTER TABLE "chatroom" ADD COLUMN     "status" "ChatroomStatus" NOT NULL DEFAULT 'ACTIVE';
