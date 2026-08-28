-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clinic_ids" TEXT NOT NULL,
    "total_schedules" INTEGER NOT NULL DEFAULT 0,
    "attended_schedules" INTEGER NOT NULL DEFAULT 0,
    "consultations" INTEGER NOT NULL DEFAULT 0,
    "exams" INTEGER NOT NULL DEFAULT 0,
    "procedures" INTEGER NOT NULL DEFAULT 0,
    "returns" INTEGER NOT NULL DEFAULT 0,
    "patients" INTEGER NOT NULL DEFAULT 0,
    "new_patients" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "combos" INTEGER NOT NULL DEFAULT 0,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_date_clinic_ids_key" ON "daily_metrics"("date", "clinic_ids");
