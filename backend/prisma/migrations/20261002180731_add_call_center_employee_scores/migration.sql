-- CreateTable
CREATE TABLE "call_center_employee_scores" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_center_employee_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "call_center_employee_scores_employee_id_month_key" ON "call_center_employee_scores"("employee_id", "month");

-- AddForeignKey
ALTER TABLE "call_center_employee_scores" ADD CONSTRAINT "call_center_employee_scores_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
