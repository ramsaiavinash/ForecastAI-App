import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { SidebarLayout } from "./components/layout/sidebar-layout";
import { Dashboard } from "./pages/Dashboard";
import { Import } from "./pages/Import";
import Batches from "./pages/Batches";
import BatchDetail from "./pages/BatchDetail";
import PLApproval from "./pages/approval/PLApproval";
import PHApproval from "./pages/approval/PHApproval";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Export from "./pages/Export";
import { useRole, UserRole } from "./context/RoleContext";

const roleAccess: Record<string, UserRole[]> = {
  "/": ["Finance", "Forecaster", "PL", "PH"],
  "/import": ["Finance"],
  "/batches": ["Finance", "Forecaster", "PL", "PH"],
  "/batches/:id": ["Finance", "Forecaster", "PL", "PH"],
  "/approval/pl": ["PL"],
  "/approval/ph": ["PH"],
  "/projects": ["Forecaster", "PL", "PH"],
  "/projects/:id": ["Forecaster", "PL", "PH"],
  "/export": ["Finance", "Forecaster", "PL", "PH"],
};

function RequireRole({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) {
  const { role } = useRole();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
  <Routes>
    <Route element={<SidebarLayout />}>
      <Route path="/" element={<RequireRole allowedRoles={roleAccess["/"]}><Dashboard /></RequireRole>} />
      <Route path="/import" element={<RequireRole allowedRoles={roleAccess["/import"]}><Import /></RequireRole>} />
      <Route path="/batches" element={<RequireRole allowedRoles={roleAccess["/batches"]}><Batches /></RequireRole>} />
      <Route path="/batches/:id" element={<RequireRole allowedRoles={roleAccess["/batches/:id"]}><BatchDetail /></RequireRole>} />
      <Route path="/approval/pl" element={<RequireRole allowedRoles={roleAccess["/approval/pl"]}><PLApproval /></RequireRole>} />
      <Route path="/approval/ph" element={<RequireRole allowedRoles={roleAccess["/approval/ph"]}><PHApproval /></RequireRole>} />
      <Route path="/projects" element={<RequireRole allowedRoles={roleAccess["/projects"]}><Projects /></RequireRole>} />
      <Route path="/projects/:id" element={<RequireRole allowedRoles={roleAccess["/projects/:id"]}><ProjectDetail /></RequireRole>} />
      <Route path="/export" element={<RequireRole allowedRoles={roleAccess["/export"]}><Export /></RequireRole>} />
    </Route>
  </Routes>
  <Toaster position="top-right" richColors />
</BrowserRouter>
    </QueryClientProvider>
  );
}