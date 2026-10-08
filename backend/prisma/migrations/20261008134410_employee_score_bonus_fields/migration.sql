-- Renomeia "score" para "voxia_score" (mantendo os dados existentes - esta
-- tabela ja tem notas reais lancadas por colaborador) e adiciona os campos
-- do programa de bonificacao: Prova, Assiduidade e Penalidades.
ALTER TABLE "call_center_employee_scores" RENAME COLUMN "score" TO "voxia_score";

ALTER TABLE "call_center_employee_scores" ADD COLUMN "test_score" DECIMAL(4,2);
ALTER TABLE "call_center_employee_scores" ADD COLUMN "has_absence_or_lateness" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "call_center_employee_scores" ADD COLUMN "has_penalty" BOOLEAN NOT NULL DEFAULT false;
