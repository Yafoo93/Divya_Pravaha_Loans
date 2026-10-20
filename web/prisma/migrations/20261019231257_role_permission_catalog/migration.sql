-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "featureGate" VARCHAR(100),
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "restrictions" TEXT[] DEFAULT ARRAY[]::TEXT[];
