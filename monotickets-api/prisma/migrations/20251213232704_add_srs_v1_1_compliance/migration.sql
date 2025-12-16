-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('PDF', 'PREMIUM_LANDING');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "maxGuests" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "maxInvitations" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "guests" ADD COLUMN     "respondedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "remainingCount" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "config" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
