import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProjectList from "./pages/ProjectList";
import RevenueEntry from "./pages/RevenueEntry";
import ImportHistory from "./pages/ImportHistory";
import SubmissionDashboard from "./pages/SubmissionDashboard";

const queryClient = new QueryClient();

const navClasses = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-md transition ${isActive ? "bg-sky-600 text-white" : "text-slate-700 hover:bg-slate-100"}`;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
              <div>
                <p className="text-lg font-semibold text-slate-900">ForecastAI</p>
                <p className="text-sm text-slate-500">Modern revenue forecasting interface</p>
              </div>
              <nav className="flex items-center gap-2">
                <NavLink to="/" className={navClasses} end>
                  Projects
                </NavLink>
                <NavLink to="/revenue" className={navClasses}>
                  Revenue Entry
                </NavLink>
                <NavLink to="/imports" className={navClasses}>
                  Import History
                </NavLink>
                <NavLink to="/submissions" className={navClasses}>
                  Submissions
                </NavLink>
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/revenue" element={<RevenueEntry />} />
              <Route path="/imports" element={<ImportHistory />} />
              <Route path="/submissions" element={<SubmissionDashboard />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
