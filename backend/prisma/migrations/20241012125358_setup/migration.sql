-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Games" (
    "id" TEXT NOT NULL,
    "whiteId" INTEGER NOT NULL,
    "blackId" INTEGER NOT NULL,
    "time" INTEGER NOT NULL,
    "winner" TEXT NOT NULL,
    "pgn" TEXT NOT NULL,

    CONSTRAINT "Games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_whiteId_fkey" FOREIGN KEY ("whiteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_blackId_fkey" FOREIGN KEY ("blackId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
