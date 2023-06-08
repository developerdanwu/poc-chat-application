/*
  Warnings:

  - You are about to drop the `OpenAiSettings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[open_ai_settings_id]` on the table `ai_settings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ai_settings" ADD COLUMN     "open_ai_settings_id" INTEGER;

-- DropTable
DROP TABLE "OpenAiSettings";

-- CreateTable
CREATE TABLE "open_ai_settings" (
    "id" SERIAL NOT NULL,
    "temperature" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "open_ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_settings_open_ai_settings_id_key" ON "ai_settings"("open_ai_settings_id");

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_open_ai_settings_id_fkey" FOREIGN KEY ("open_ai_settings_id") REFERENCES "open_ai_settings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
