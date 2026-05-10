import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Building2, User, Calendar, Tag, FolderOpen, TrendingUp } from "lucide-react";

const API_BASE = "";

function getStatusInfo(endDate: string) {
  if (!endDate) return { label: "Active", color: "bg-emerald-100 text-emerald-700" };
  const end = new Date(endDate);
  const now = new Date();
  const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return { label: "Completed", color: "bg-slate-100 text-slate-500" };
  if (diffDays < 90) return { label: "Ending Soon", color: "bg-orange-100 text-orange-700" };
  return { label: "Active", color: "bg-emerald-100 text-emerald-700" };
}

export default function Projects() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [towerFilter, setTowerFilter] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", search, towerFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (towerFilter) params.set("tower", towerFilter);
      const res = await fetch(`${API_BASE}/api/projects?${params}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const towers = Array.from(new Set(projects.map((p: any) => p.tower).filter(Boolean))).sort();

  return (
    <div className="space-y-6 px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and manage all forecast projects</p>
        </div>
        {projects.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-slate-900">{projects.length}</span>
            <span className="text-xs text-slate-500 ml-1.5">projects</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by project name, ID, or customer..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={towerFilter}
            onChange={e => setTowerFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer shadow-sm min-w-[140px]"
          >
            <option value="">All Towers</option>
            {towers.map((t: any) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 text-lg">No projects found</h3>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or import a CSV file</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project: any) => {
            const status = getStatusInfo(project.projectEndDate);
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer p-5"
              >
                {/* Top row: icon + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-1">
                      {project.projectDescription || "—"}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{project.projectId}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{project.customerDescription || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{project.pmName || "NOT AVAILABLE"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>
                      {project.projectEndDate
                        ? `Ends ${new Date(project.projectEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : "No end date"}
                    </span>
                  </div>
                </div>

                {/* Bottom: Tower + Status */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  {project.tower && (
                    <span className="bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-bold">
                      {project.tower}
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                  {project.category && (
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ml-auto ${
                      project.category === "Backlog" ? "bg-blue-50 text-blue-600" : "bg-yellow-50 text-yellow-600"
                    }`}>
                      {project.category}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
