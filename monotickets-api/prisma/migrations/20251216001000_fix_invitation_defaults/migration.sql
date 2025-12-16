-- Ensure invitation status default uses the new enum value after previous migration
ALTER TABLE "invitations" ALTER COLUMN "status" SET DEFAULT 'CREATED';
