-- Troca granularidade de lancamento manual do Call Center de diaria para
-- mensal: dropa call_center_daily_metrics (so tinha dados de teste) e cria
-- call_center_monthly_metrics.
DROP TABLE "call_center_daily_metrics";

CREATE TABLE "call_center_monthly_metrics" (
    "id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "offered_calls" INTEGER NOT NULL DEFAULT 0,
    "answered_calls" INTEGER NOT NULL DEFAULT 0,
    "voxia_score" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_center_monthly_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "call_center_monthly_metrics_month_key" ON "call_center_monthly_metrics"("month");
