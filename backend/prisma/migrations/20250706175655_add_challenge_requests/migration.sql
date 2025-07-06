-- CreateTable
CREATE TABLE "ChallengeRequest" (
    "id" SERIAL NOT NULL,
    "challengerId" INTEGER NOT NULL,
    "challengedId" INTEGER NOT NULL,
    "timeControl" INTEGER NOT NULL DEFAULT 600,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeRequest_challengerId_idx" ON "ChallengeRequest"("challengerId");

-- CreateIndex
CREATE INDEX "ChallengeRequest_challengedId_idx" ON "ChallengeRequest"("challengedId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeRequest_challengerId_challengedId_key" ON "ChallengeRequest"("challengerId", "challengedId");

-- AddForeignKey
ALTER TABLE "ChallengeRequest" ADD CONSTRAINT "ChallengeRequest_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeRequest" ADD CONSTRAINT "ChallengeRequest_challengedId_fkey" FOREIGN KEY ("challengedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
