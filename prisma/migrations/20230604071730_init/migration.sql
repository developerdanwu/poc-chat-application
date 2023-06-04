CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('MESSAGE', 'AI_RESPONSE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageVisibility" AS ENUM ('ME', 'ALL');

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
CREATE TABLE "author" (
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "author_id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

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
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "no_of_users" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "chatroom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_author_id_idx" ON "message"("author_id");

-- CreateIndex
CREATE INDEX "message_chatroom_id_idx" ON "message"("chatroom_id");

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
ALTER TABLE "_authors_on_chatrooms" ADD CONSTRAINT "_authors_on_chatrooms_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("author_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_authors_on_chatrooms" ADD CONSTRAINT "_authors_on_chatrooms_chatroom_id_fkey" FOREIGN KEY ("chatroom_id") REFERENCES "chatroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
