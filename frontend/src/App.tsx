import { Route, Routes } from "react-router-dom";
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
        <Route path="/" element={<Dashboard />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/colaboradores" element={<Employees />} />
        <Route path="/colaboradores/:employeeId" element={<EmployeeDetail />} />
        <Route path="/drclick" element={<DrClickIntegration />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/configuracoes" element={<Settings />} />
      </Route>
    </Routes>
  );
}
