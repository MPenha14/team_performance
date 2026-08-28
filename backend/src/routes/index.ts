import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth.middleware";
import { postLogin } from "../controllers/auth.controller";
import {
  getPerformance,
  getPerformanceById,
  getPerformanceHistoryById,
} from "../controllers/performance.controller";
import { getSchedules } from "../controllers/schedules.controller";
import { getUsers } from "../controllers/users.controller";
import { getClinics } from "../controllers/clinics.controller";
import { getSyncLogs, postSync } from "../controllers/sync.controller";
import { getHealth } from "../controllers/health.controller";
import { getDashboard } from "../controllers/dashboard.controller";
import {
  deleteEmployeeById,
  getEmployeeById,
  getEmployees,
  postEmployee,
  putEmployee,
} from "../controllers/employees.controller";
import {
  deleteMappingById,
  getMappings,
  postAutoMap,
  putEmployeeMapping,
} from "../controllers/mapping.controller";

export const router = Router();

router.get("/health", asyncHandler(getHealth));
router.post("/auth/login", asyncHandler(postLogin));

// Todas as rotas abaixo exigem login (token JWT emitido em /auth/login).
router.use(requireAuth);

router.get("/dashboard", asyncHandler(getDashboard));

router.get("/performance", asyncHandler(getPerformance));
router.get("/performance/:employeeId/history", asyncHandler(getPerformanceHistoryById));
router.get("/performance/:employeeId", asyncHandler(getPerformanceById));

router.get("/schedules", asyncHandler(getSchedules));

router.get("/users", asyncHandler(getUsers));

router.get("/clinics", getClinics);

router.post("/sync", asyncHandler(postSync));
router.get("/sync/logs", asyncHandler(getSyncLogs));

router.get("/employees", asyncHandler(getEmployees));
router.post("/employees", asyncHandler(postEmployee));
router.get("/employees/:id", asyncHandler(getEmployeeById));
router.put("/employees/:id", asyncHandler(putEmployee));
router.delete("/employees/:id", asyncHandler(deleteEmployeeById));
router.put("/employees/:id/mapping", asyncHandler(putEmployeeMapping));

router.get("/mappings", asyncHandler(getMappings));
router.delete("/mappings/:id", asyncHandler(deleteMappingById));
router.post("/mappings/auto-map", asyncHandler(postAutoMap));
