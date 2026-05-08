import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Building2, User, Calendar, FolderOpen } from "lucide-react";
import { getProjectStatusColor } from "@/lib/utils";
import { ProjectMaster } from "@/types/index";

const API_BASE = "";

export default function Projects() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [towerFilter, setTowerFilter] = useState("");

  const { data: projects = [], isLoading } = useQuery<ProjectMaster[]>({
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

  const towers = Array.from(new Set(projects.map((p) => p.tower).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <p className="text-sm text-slate-500 mt-1">View project details and monthly revenue breakdown</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={towerFilter}
            onChange={(e) => setTowerFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 appearance-none cursor-pointer"
          >
            <option value="">All Towers</option>
            {towers.map((t) => (
              <option key={t} value={t!}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No projects found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or import a CSV file</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const status = getProjectStatusColor(project.projectEndDate);
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer"
              >
                {/* Title */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{project.projectDescription}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1 truncate">{project.projectId}</p>
                </div>

                {/* Details */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{project.customerDescription || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{project.pmName || "NOT AVAILABLE"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm">{new Date(project.projectEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>

                {/* Footer badges */}
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                  {project.tower && (
                    <span className="bg-slate-700 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                      {project.tower}
                    </span>
                  )}
                  {project.market && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {project.market}
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}