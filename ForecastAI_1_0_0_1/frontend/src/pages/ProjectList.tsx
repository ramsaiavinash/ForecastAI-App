import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface ProjectMaster {
  id: string;
  businessUnitDescription?: string | null;
  category?: string | null;
  customerDescription?: string | null;
  opportunityName?: string | null;
  projectDescription?: string | null;
  projectEndDate?: string | null;
}

const fetchProjects = async () => {
  const response = await fetch("/api/project-masters");
  if (!response.ok) {
    throw new Error("Failed to load projects");
  }
  return response.json() as Promise<ProjectMaster[]>;
};

export default function ProjectList() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { data = [], isLoading, error } = useQuery(["projectMasters"], fetchProjects);

  const filteredProjects = useMemo(() => {
    return data.filter((project) => {
      const normalized = `${project.category ?? ""} ${project.businessUnitDescription ?? ""} ${project.customerDescription ?? ""} ${project.opportunityName ?? ""} ${project.projectDescription ?? ""}`.toLowerCase();
      const query = search.trim().toLowerCase();
      const categoryMatch = categoryFilter ? (project.category ?? "").toLowerCase().includes(categoryFilter.toLowerCase()) : true;
      return categoryMatch && (!query || normalized.includes(query));
    });
  }, [data, search, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Project list</h1>
            <p className="text-sm text-slate-500">Search and filter projects in your revenue forecast dataset.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects, opportunity, customer..."
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:w-80"
            />
            <input
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              placeholder="Filter category"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:w-56"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Project Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Opportunity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading projects...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-600">
                    Error loading projects.
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No projects match your current filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{project.businessUnitDescription ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{project.category ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{project.opportunityName ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{project.customerDescription ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{project.projectEndDate ? new Date(project.projectEndDate).toLocaleDateString() : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
