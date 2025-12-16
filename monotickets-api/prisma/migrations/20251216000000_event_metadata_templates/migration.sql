-- CreateEnum
CREATE TYPE "InviteMode" AS ENUM ('PDF', 'PREMIUM');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable: events metadata
ALTER TABLE "events" ADD COLUMN "eventAt" TIMESTAMP(3);
UPDATE "events" SET "eventAt" = "date" WHERE "eventAt" IS NULL;
ALTER TABLE "events" ALTER COLUMN "eventAt" SET NOT NULL;
ALTER TABLE "events" ADD COLUMN "category" TEXT;
ALTER TABLE "events" ADD COLUMN "venueText" TEXT;
ALTER TABLE "events" ADD COLUMN "inviteMode" "InviteMode";
UPDATE "events" SET "inviteMode" = 'PDF' WHERE "inviteMode" IS NULL;
ALTER TABLE "events" ALTER COLUMN "inviteMode" SET NOT NULL;
ALTER TABLE "events" ALTER COLUMN "inviteMode" SET DEFAULT 'PDF';
ALTER TABLE "events" ADD COLUMN "guestCountDefault" INTEGER;
UPDATE "events" SET "guestCountDefault" = 1 WHERE "guestCountDefault" IS NULL;
ALTER TABLE "events" ALTER COLUMN "guestCountDefault" SET NOT NULL;
ALTER TABLE "events" ALTER COLUMN "guestCountDefault" SET DEFAULT 1;
ALTER TABLE "events" ADD COLUMN "allowPartialEntry" BOOLEAN;
UPDATE "events" SET "allowPartialEntry" = true WHERE "allowPartialEntry" IS NULL;
ALTER TABLE "events" ALTER COLUMN "allowPartialEntry" SET NOT NULL;
ALTER TABLE "events" ALTER COLUMN "allowPartialEntry" SET DEFAULT true;
ALTER TABLE "events" DROP COLUMN "date";

-- AlterTable: users defaults
ALTER TABLE "users" ADD COLUMN "brandDefaults" JSONB;
ALTER TABLE "users" ADD COLUMN "preferredInviteMode" "InviteMode";
UPDATE "users" SET "preferredInviteMode" = 'PDF' WHERE "preferredInviteMode" IS NULL;
ALTER TABLE "users" ALTER COLUMN "preferredInviteMode" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "preferredInviteMode" SET DEFAULT 'PDF';

-- CreateTable: premium_configs
CREATE TABLE "premium_configs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "colors" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "reduceMotionDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "premium_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pdf_templates
CREATE TABLE "pdf_templates" (
    "id" TEXT NOT NULL,
    "ownerPlannerId" TEXT,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pdf_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: event_pdf_configs
CREATE TABLE "event_pdf_configs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "templateId" TEXT,
    "customPdfUrl" TEXT,
    "qrPlacement" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_pdf_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: media
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "ownerPlannerId" TEXT,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "mime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable: staff
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex / FKs
CREATE UNIQUE INDEX "premium_configs_eventId_key" ON "premium_configs"("eventId");
CREATE UNIQUE INDEX "event_pdf_configs_eventId_key" ON "event_pdf_configs"("eventId");
CREATE UNIQUE INDEX "staff_token_key" ON "staff"("token");

ALTER TABLE "premium_configs" ADD CONSTRAINT "premium_configs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pdf_templates" ADD CONSTRAINT "pdf_templates_ownerPlannerId_fkey" FOREIGN KEY ("ownerPlannerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "event_pdf_configs" ADD CONSTRAINT "event_pdf_configs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_pdf_configs" ADD CONSTRAINT "event_pdf_configs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "pdf_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_ownerPlannerId_fkey" FOREIGN KEY ("ownerPlannerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff" ADD CONSTRAINT "staff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
