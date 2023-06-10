/*
  Warnings:

  - A unique constraint covering the columns `[chatroom_id]` on the table `ai_settings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chatroom_id` to the `ai_settings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ai_settings" ADD COLUMN     "chatroom_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ai_settings_chatroom_id_key" ON "ai_settings"("chatroom_id");

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_chatroom_id_fkey" FOREIGN KEY ("chatroom_id") REFERENCES "chatroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
