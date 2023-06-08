/*
  Warnings:

  - You are about to drop the `AiSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AiSettings" DROP CONSTRAINT "AiSettings_author_id_fkey";

-- DropTable
DROP TABLE "AiSettings";

-- CreateTable
CREATE TABLE "OpenAiSettings" (
    "id" SERIAL NOT NULL,
    "temperature" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "OpenAiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_settings" (
    "id" SERIAL NOT NULL,
    "model" "AiModel" NOT NULL,
    "author_id" INTEGER NOT NULL,

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_settings_author_id_key" ON "ai_settings"("author_id");

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("author_id") ON DELETE RESTRICT ON UPDATE CASCADE;
