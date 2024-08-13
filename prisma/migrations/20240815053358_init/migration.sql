-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discardedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sharePath" TEXT,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discardedAt" TIMESTAMP(3),

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discardedAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fbApiToken" TEXT NOT NULL,
    "fbAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discardedAt" TIMESTAMP(3),

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_email_discardedAt_idx" ON "users"("email", "discardedAt");

-- CreateIndex
CREATE INDEX "chats_userId_discardedAt_idx" ON "chats"("userId", "discardedAt");

-- CreateIndex
CREATE INDEX "messages_chatId_userId_discardedAt_idx" ON "messages"("chatId", "userId", "discardedAt");

-- CreateIndex
CREATE INDEX "user_credentials_userId_discardedAt_idx" ON "user_credentials"("userId", "discardedAt");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
