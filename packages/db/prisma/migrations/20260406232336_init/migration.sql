-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('PLAYING', 'COMPLETED', 'DROPPED', 'WANT', 'ON_HOLD');

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game" (
    "id" TEXT NOT NULL,
    "external_api_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cover_url" TEXT,
    "description" TEXT,
    "release_date" TIMESTAMP(3),
    "trailer_url" TEXT,
    "igdb_score" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_game" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL,
    "score" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GameToGenre" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GameToGenre_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GameToPlatform" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GameToPlatform_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "game_external_api_key_key" ON "game"("external_api_key");

-- CreateIndex
CREATE UNIQUE INDEX "genre_name_key" ON "genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "platform_name_key" ON "platform"("name");

-- CreateIndex
CREATE INDEX "review_user_id_idx" ON "review"("user_id");

-- CreateIndex
CREATE INDEX "review_game_id_idx" ON "review"("game_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_user_id_game_id_key" ON "review"("user_id", "game_id");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_game_user_id_idx" ON "user_game"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_game_user_id_game_id_key" ON "user_game"("user_id", "game_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "_GameToGenre_B_index" ON "_GameToGenre"("B");

-- CreateIndex
CREATE INDEX "_GameToPlatform_B_index" ON "_GameToPlatform"("B");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_game" ADD CONSTRAINT "user_game_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_game" ADD CONSTRAINT "user_game_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToGenre" ADD CONSTRAINT "_GameToGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToGenre" ADD CONSTRAINT "_GameToGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToPlatform" ADD CONSTRAINT "_GameToPlatform_A_fkey" FOREIGN KEY ("A") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToPlatform" ADD CONSTRAINT "_GameToPlatform_B_fkey" FOREIGN KEY ("B") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;
