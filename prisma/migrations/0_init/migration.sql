-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";

-- CreateEnum
CREATE TYPE "ChatroomStatus" AS ENUM ('ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "ChatroomSubtype" AS ENUM ('OPENAI_CHATROOM', 'DEFAULT');

-- CreateEnum
CREATE TYPE "ChatroomType" AS ENUM ('HUMAN_CHATROOM', 'AI_CHATROOM', 'CHATROOM_BRANCH');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('MESSAGE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageVisibility" AS ENUM ('ME', 'ALL');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'AI');

-- CreateEnum
CREATE TYPE "AiModel" AS ENUM ('OPENAI');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('OPENAI_RESPONSE');

-- CreateTable
CREATE TABLE "message" (
    "client_message_id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" INTEGER NOT NULL,
    "chatroom_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "status" "MessageStatus" NOT NULL,
    "visibility" "MessageVisibility" NOT NULL,

    CONSTRAINT "message_pkey" PRIMARY KEY ("client_message_id")
);

-- CreateTable
CREATE TABLE "attachment" (
    "attachment_id" SERIAL NOT NULL,
    "message_client_message_id" INTEGER NOT NULL,
    "type" "AttachmentType" NOT NULL,

    CONSTRAINT "attachment_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "open_ai_settings" (
    "id" SERIAL NOT NULL,
    "temperature" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "open_ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_settings" (
    "id" SERIAL NOT NULL,
    "model" "AiModel" NOT NULL,
    "author_id" INTEGER NOT NULL,
    "open_ai_settings_id" INTEGER,
    "chatroom_id" TEXT NOT NULL,

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "author" (
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "author_id" SERIAL NOT NULL,
    "role" "Role" NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "human_user_id" INTEGER,

    CONSTRAINT "author_pkey" PRIMARY KEY ("author_id")
);

-- CreateTable
CREATE TABLE "_authors_on_chatrooms" (
    "author_id" INTEGER NOT NULL,
    "chatroom_id" TEXT NOT NULL,

    CONSTRAINT "_authors_on_chatrooms_pkey" PRIMARY KEY ("author_id","chatroom_id")
);

-- CreateTable
CREATE TABLE "chatroom" (
    "id" TEXT NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "type" "ChatroomType" NOT NULL DEFAULT 'HUMAN_CHATROOM',
    "subtype" "ChatroomSubtype" NOT NULL DEFAULT 'DEFAULT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "chatroom_branch_id" TEXT,
    "status" "ChatroomStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "chatroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slack_chatroom" (
    "slack_chatroom_id" TEXT NOT NULL,
    "conversationSummary" TEXT NOT NULL,

    CONSTRAINT "slack_chatroom_pkey" PRIMARY KEY ("slack_chatroom_id")
);

-- CreateTable
CREATE TABLE "slack_message" (
    "id" SERIAL NOT NULL,
    "slack_chatroom_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" vector,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slack_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_author_id_idx" ON "message"("author_id");

-- CreateIndex
CREATE INDEX "message_chatroom_id_idx" ON "message"("chatroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_settings_author_id_key" ON "ai_settings"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_settings_open_ai_settings_id_key" ON "ai_settings"("open_ai_settings_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_settings_chatroom_id_key" ON "ai_settings"("chatroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "author_email_key" ON "author"("email");

-- CreateIndex
CREATE UNIQUE INDEX "author_user_id_key" ON "author"("user_id");

-- CreateIndex
CREATE INDEX "author_author_id_idx" ON "author"("author_id");

-- CreateIndex
CREATE INDEX "_authors_on_chatrooms_chatroom_id_idx" ON "_authors_on_chatrooms"("chatroom_id");

-- CreateIndex
CREATE INDEX "_authors_on_chatrooms_author_id_idx" ON "_authors_on_chatrooms"("author_id");

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("author_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_chatroom_id_fkey" FOREIGN KEY ("chatroom_id") REFERENCES "chatroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_message_client_message_id_fkey" FOREIGN KEY ("message_client_message_id") REFERENCES "message"("client_message_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("author_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_chatroom_id_fkey" FOREIGN KEY ("chatroom_id") REFERENCES "chatroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_open_ai_settings_id_fkey" FOREIGN KEY ("open_ai_settings_id") REFERENCES "open_ai_settings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author" ADD CONSTRAINT "author_human_user_id_fkey" FOREIGN KEY ("human_user_id") REFERENCES "author"("author_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_authors_on_chatrooms" ADD CONSTRAINT "_authors_on_chatrooms_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("author_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_authors_on_chatrooms" ADD CONSTRAINT "_authors_on_chatrooms_chatroom_id_fkey" FOREIGN KEY ("chatroom_id") REFERENCES "chatroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatroom" ADD CONSTRAINT "chatroom_chatroom_branch_id_fkey" FOREIGN KEY ("chatroom_branch_id") REFERENCES "chatroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slack_message" ADD CONSTRAINT "slack_message_slack_chatroom_id_fkey" FOREIGN KEY ("slack_chatroom_id") REFERENCES "slack_chatroom"("slack_chatroom_id") ON DELETE RESTRICT ON UPDATE CASCADE;
