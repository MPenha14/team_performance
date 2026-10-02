-- CreateTable
CREATE TABLE "call_center_daily_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "offered_calls" INTEGER NOT NULL DEFAULT 0,
    "answered_calls" INTEGER NOT NULL DEFAULT 0,
    "voxia_score" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_center_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "call_center_daily_metrics_date_key" ON "call_center_daily_metrics"("date");
