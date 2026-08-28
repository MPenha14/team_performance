-- AlterTable
ALTER TABLE "daily_metrics" ADD COLUMN     "status_breakdown" JSONB NOT NULL DEFAULT '{}';
