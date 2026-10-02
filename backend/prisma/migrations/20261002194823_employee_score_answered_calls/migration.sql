-- AlterTable
ALTER TABLE "call_center_employee_scores" ADD COLUMN     "answered_calls" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "score" DROP NOT NULL;
