/*
  Warnings:

  - A unique constraint covering the columns `[guest_session_id,game_id]` on the table `user_game` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user_game" ADD COLUMN     "guest_session_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "guest_session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "guest_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_session_token_key" ON "guest_session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "guest_session_fingerprint_key" ON "guest_session"("fingerprint");

-- CreateIndex
CREATE INDEX "user_game_guest_session_id_idx" ON "user_game"("guest_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_game_guest_session_id_game_id_key" ON "user_game"("guest_session_id", "game_id");

-- AddForeignKey
ALTER TABLE "user_game" ADD CONSTRAINT "user_game_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "guest_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
