import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Performance } from "./pages/Performance";
import { Ranking } from "./pages/Ranking";
import { Employees } from "./pages/Employees";
import { EmployeeDetail } from "./pages/EmployeeDetail";
import { DrClickIntegration } from "./pages/DrClickIntegration";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { TVDashboard } from "./pages/TVDashboard";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/tv"
        element={
          <ProtectedRoute>
            <TVDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/call-center" replace />} />

        <Route path="/call-center" element={<Dashboard team="CALL_CENTER" />} />
        <Route path="/call-center/performance" element={<Performance team="CALL_CENTER" />} />
        <Route path="/call-center/colaboradores" element={<Employees team="CALL_CENTER" />} />
        <Route path="/call-center/colaboradores/:employeeId" element={<EmployeeDetail />} />
        <Route path="/call-center/ranking" element={<Ranking team="CALL_CENTER" />} />

        <Route path="/midias-sociais" element={<Dashboard team="MIDIAS_SOCIAIS" />} />
        <Route path="/midias-sociais/performance" element={<Performance team="MIDIAS_SOCIAIS" />} />
        <Route path="/midias-sociais/colaboradores" element={<Employees team="MIDIAS_SOCIAIS" />} />
        <Route path="/midias-sociais/colaboradores/:employeeId" element={<EmployeeDetail />} />
        <Route path="/midias-sociais/ranking" element={<Ranking team="MIDIAS_SOCIAIS" />} />

        <Route path="/drclick" element={<DrClickIntegration />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/configuracoes" element={<Settings />} />
      </Route>
    </Routes>
  );
}
