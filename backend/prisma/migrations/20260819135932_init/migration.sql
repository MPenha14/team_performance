-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "admission_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drclick_mappings" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "drclick_user_id" TEXT NOT NULL,
    "drclick_name" TEXT NOT NULL,
    "drclick_role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drclick_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clinic_id" TEXT,
    "date" DATE NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "role" TEXT,
    "patients" INTEGER NOT NULL DEFAULT 0,
    "new_patients" INTEGER NOT NULL DEFAULT 0,
    "consultations" INTEGER NOT NULL DEFAULT 0,
    "exams" INTEGER NOT NULL DEFAULT 0,
    "procedures" INTEGER NOT NULL DEFAULT 0,
    "returns" INTEGER NOT NULL DEFAULT 0,
    "combos" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "serviceorder_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "serviceorder_billed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amoun_plan" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_records" (
    "id" TEXT NOT NULL,
    "external_id" TEXT,
    "user_id" TEXT,
    "clinic_id" TEXT,
    "status" TEXT NOT NULL,
    "status_text" TEXT,
    "creation_date" TIMESTAMP(3),
    "schedule_date" TIMESTAMP(3) NOT NULL,
    "patient" TEXT NOT NULL,
    "professional" TEXT,
    "category" TEXT,
    "service" TEXT,
    "convenio" TEXT,
    "value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "health_plan_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "idordemservico" TEXT,
    "sync_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_channels" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_origins" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_origins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "clinic_ids" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "message" TEXT,
    "records_synced" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drclick_mappings_drclick_user_id_key" ON "drclick_mappings"("drclick_user_id");

-- CreateIndex
CREATE INDEX "drclick_mappings_employee_id_idx" ON "drclick_mappings"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE INDEX "performance_snapshots_date_idx" ON "performance_snapshots"("date");

-- CreateIndex
CREATE UNIQUE INDEX "performance_snapshots_user_id_start_date_end_date_key" ON "performance_snapshots"("user_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "schedule_records_schedule_date_idx" ON "schedule_records"("schedule_date");

-- CreateIndex
CREATE INDEX "schedule_records_status_idx" ON "schedule_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_records_patient_schedule_date_service_professional_key" ON "schedule_records"("patient", "schedule_date", "service", "professional");

-- CreateIndex
CREATE UNIQUE INDEX "service_channels_start_date_end_date_name_key" ON "service_channels"("start_date", "end_date", "name");

-- CreateIndex
CREATE UNIQUE INDEX "service_origins_start_date_end_date_name_key" ON "service_origins"("start_date", "end_date", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sync_logs_start_date_end_date_clinic_ids_key" ON "sync_logs"("start_date", "end_date", "clinic_ids");

-- AddForeignKey
ALTER TABLE "drclick_mappings" ADD CONSTRAINT "drclick_mappings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_snapshots" ADD CONSTRAINT "performance_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_snapshots" ADD CONSTRAINT "performance_snapshots_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_records" ADD CONSTRAINT "schedule_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_records" ADD CONSTRAINT "schedule_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
