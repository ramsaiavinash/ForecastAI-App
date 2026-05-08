import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { SidebarLayout } from "./components/layout/sidebar-layout";
import { Dashboard } from "./pages/Dashboard";
import { Import } from "./pages/Import";
import  Batches  from "./pages/Batches";
import BatchDetail from "./pages/BatchDetail";
import PLApproval from "./pages/approval/PLApproval";
import PHApproval from "./pages/approval/PHApproval";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Export from "./pages/Export";

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
      <Route path="/" element={<Dashboard />} />
      <Route path="/import" element={<Import />} />
      <Route path="/batches" element={<Batches />} />
      <Route path="/batches/:id" element={<BatchDetail />} />
      <Route path="/approval/pl" element={<PLApproval />} />
      <Route path="/approval/ph" element={<PHApproval />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/export" element={<Export />} />
    </Route>
  </Routes>
  <Toaster position="top-right" richColors />
</BrowserRouter>
    </QueryClientProvider>
  );
}