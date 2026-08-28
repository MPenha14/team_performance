-- DropIndex
DROP INDEX "sync_logs_start_date_end_date_clinic_ids_key";

-- AlterTable
ALTER TABLE "sync_logs" ADD COLUMN     "finished_at" TIMESTAMP(3),
ADD COLUMN     "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "sync_logs_started_at_idx" ON "sync_logs"("started_at");
