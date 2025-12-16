-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "scans" DROP CONSTRAINT "scans_qrToken_fkey";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedBy" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "guests" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "declinedAt" TIMESTAMP(3),
ADD COLUMN     "inviteReceivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "remainingCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ALTER COLUMN "qrToken" DROP NOT NULL;

-- AlterTable
ALTER TABLE "scans" ADD COLUMN     "enteredNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "invitationId" TEXT,
ADD COLUMN     "remainingCountAfter" INTEGER,
ALTER COLUMN "qrToken" DROP NOT NULL;

-- CreateTable
CREATE TABLE "rsvp_configs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "allowRsvp" BOOLEAN NOT NULL DEFAULT true,
    "rsvpDeadlineDays" INTEGER NOT NULL DEFAULT 0,
    "revocationWindowDays" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvp_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rsvp_configs_eventId_key" ON "rsvp_configs"("eventId");

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_configs" ADD CONSTRAINT "rsvp_configs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
