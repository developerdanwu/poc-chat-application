-- AlterEnum
ALTER TYPE "ChatroomType" ADD VALUE 'CHATROOM_BRANCH';

-- AlterTable
ALTER TABLE "chatroom" ADD COLUMN     "chatroom_branch_id" TEXT;

-- AddForeignKey
ALTER TABLE "chatroom" ADD CONSTRAINT "chatroom_chatroom_branch_id_fkey" FOREIGN KEY ("chatroom_branch_id") REFERENCES "chatroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
