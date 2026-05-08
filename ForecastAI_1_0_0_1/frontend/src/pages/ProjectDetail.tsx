import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, User, Calendar, TrendingUp } from "lucide-react";
import { formatCompactCurrency } from "@/lib/utils";

const API_BASE = "";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ProjectData {
  project: {
    projectDescription: string;
    projectId: string;
    customerDescription: string;
    tower: string;
    category: string;
    businessUnitDescription: string;
    marketsDescription: string;
    verticalDescription: string;
    projectEndDate: string;
    pmName: string;
    pdlName: string;
    edlName: string;
  };
  revenues: Array<{
    month: number;
    amount: number;
    batchId: string;
    isEstimated: boolean;
  }>;
  batches: Array<{
    id: string;
    batchName: string;
    status: string;
  }>;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(name?: string): string {
  if (!name) return "bg-slate-300";
  const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-green-500", "bg-orange-500"];
  const hash = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0);
  return colors[hash % colors.length];
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/projects/${id}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json() as Promise<ProjectData>;
    },
    enabled: !!id,
  });

  const project = data?.project;
  const revenues = data?.revenues || [];
  const batches = data?.batches || [];

  // Group revenues by batch and month
  const revenueMap = new Map<string, Map<number, any>>();
  for (const rev of revenues) {
    if (!revenueMap.has(rev.batchId)) revenueMap.set(rev.batchId, new Map());
    revenueMap.get(rev.batchId)!.set(rev.month, rev);
  }

  // Calculate stats
  const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
  const actualsRevenue = revenues.filter((r) => !r.isEstimated).reduce((sum, r) => sum + (r.amount || 0), 0);
  const forecastRevenue = revenues.filter((r) => r.isEstimated).reduce((sum, r) => sum + (r.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-40 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!project) return <div className="text-center text-slate-500 py-20">Project not found</div>;

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/projects")}
          className="mt-1 p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{project.projectDescription}</h1>
            {project.tower && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {project.tower}
              </span>
            )}
            {project.category && (
              <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {project.category}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 font-mono mt-1">{project.projectId}</p>
          <p className="text-sm text-slate-600 mt-1">{project.customerDescription}</p>
        </div>
      </div>

      {/* Metadata Row */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Business Unit</p>
            <p className="text-slate-700 font-medium mt-1">{project.businessUnitDescription || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Market</p>
            <p className="text-slate-700 font-medium mt-1">{project.marketsDescription || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Vertical</p>
            <p className="text-slate-700 font-medium mt-1">{project.verticalDescription || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">End Date</p>
            <p className="text-slate-700 font-medium mt-1">
              {new Date(project.projectEndDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Project Team Row */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-4">Project Team</p>
        <div className="flex items-center gap-6 flex-wrap">
          {[
            { role: "PM", name: project.pmName },
            { role: "PDL", name: project.pdlName },
            { role: "EDL", name: project.edlName },
          ].map(({ role, name }) => (
            <div key={role} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${getAvatarColor(name)} flex items-center justify-center text-white text-xs font-bold`}>
                {getInitials(name)}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{role}</p>
                <p className="text-sm font-medium text-slate-700">{name || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Revenue</p>
          <p className="text-xl font-bold text-slate-900 mt-2">{formatCompactCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Actuals</p>
          </div>
          <p className="text-xl font-bold text-blue-600 mt-2">{formatCompactCurrency(actualsRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Forecast</p>
          </div>
          <p className="text-xl font-bold text-green-600 mt-2">{formatCompactCurrency(forecastRevenue)}</p>
        </div>
      </div>

      {/* Monthly Revenue Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Monthly Revenue</h2>
              <p className="text-xs text-slate-400 mt-0.5">Revenue by batch and month</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[180px]">
                  Batch
                </th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[70px]">
                    {m}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[80px]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-10 text-slate-400">
                    No revenue data available
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const batchRevenues = revenueMap.get(batch.id) || new Map();
                  const total = MONTHS.reduce((sum, _, monthIdx) => {
                    const rev = batchRevenues.get(monthIdx + 1);
                    return sum + (rev?.amount || 0);
                  }, 0);

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800 truncate">{batch.batchName}</td>
                      {MONTHS.map((_, monthIdx) => {
                        const rev = batchRevenues.get(monthIdx + 1);
                        const amount = rev?.amount || 0;
                        const bgClass = rev?.isEstimated ? "bg-green-50" : "bg-blue-50";
                        return (
                          <td key={monthIdx} className={`px-2 py-3 text-right text-xs font-medium ${bgClass} ${rev ? "text-slate-700" : "text-slate-300"}`}>
                            {amount !== 0 ? formatCompactCurrency(amount) : "—"}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 text-sm">
                        {formatCompactCurrency(total)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-50 rounded border border-blue-200" />
            <span>Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-50 rounded border border-green-200" />
            <span>Forecast</span>
          </div>
        </div>
      </div>
    </div>
  );
}