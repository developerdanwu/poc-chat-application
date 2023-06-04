/*
  Warnings:

  - You are about to drop the column `no_of_users` on the `chatroom` table. All the data in the column will be lost.
  - Added the required column `type` to the `chatroom` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChatroomType" AS ENUM ('HUMAN_CHATROOM', 'AI_CHATROOM');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'AI');

-- CreateEnum
CREATE TYPE "AiModel" AS ENUM ('OPENAI');

-- AlterTable
ALTER TABLE "author" ADD COLUMN     "human_user_id" INTEGER;

-- AlterTable
ALTER TABLE "chatroom" DROP COLUMN "no_of_users",
ADD COLUMN     "type" "ChatroomType" NOT NULL;

-- CreateTable
CREATE TABLE "AiSettings" (
    "id" SERIAL NOT NULL,
    "model" "AiModel" NOT NULL,
    "author_id" INTEGER NOT NULL,

    CONSTRAINT "AiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiSettings_author_id_key" ON "AiSettings"("author_id");

-- AddForeignKey
ALTER TABLE "AiSettings" ADD CONSTRAINT "AiSettings_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("author_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author" ADD CONSTRAINT "author_human_user_id_fkey" FOREIGN KEY ("human_user_id") REFERENCES "author"("author_id") ON DELETE SET NULL ON UPDATE CASCADE;
