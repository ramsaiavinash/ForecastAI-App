import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Clock, CheckCircle, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { formatCompactCurrency, getBatchStatusColor } from "@/lib/utils";
import { BatchStatus } from "@/types/index";

const API_BASE = "";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["batch", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/batches/${id}`);
      if (!res.ok) throw new Error("Failed to fetch batch");
      return res.json();
    },
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`${API_BASE}/api/batches/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, status) => {
      toast.success(`Batch status updated to "${status}"`);
      queryClient.invalidateQueries({ queryKey: ["batch", id] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
    onError: () => toast.error("Failed to update batch status"),
  });

  const batch = data?.batch;
  const revenues = data?.revenues || [];
  const projects = data?.projects || [];

  // Group revenues by project
  const projectMap = new Map<string, { project: any; months: Record<number, any> }>();
  for (const rev of revenues) {
    if (!projectMap.has(rev.projectId)) {
      const project = projects.find((p: any) => p.id === rev.projectId);
      projectMap.set(rev.projectId, { project, months: {} });
    }
    projectMap.get(rev.projectId)!.months[rev.month] = rev;
  }

  const projectRows = Array.from(projectMap.values());
  const uniqueProjects = projectRows.length;

  const statusIcon: Record<BatchStatus, JSX.Element> = {
    Draft: <Clock className="w-3.5 h-3.5" />,
    "Under Review": <Clock className="w-3.5 h-3.5" />,
    "Approved PL": <CheckCircle className="w-3.5 h-3.5" />,
    "Approved PH": <Shield className="w-3.5 h-3.5" />,
    Locked: <Lock className="w-3.5 h-3.5" />,
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!batch) return <div className="text-center text-slate-500 py-20">Batch not found</div>;

  const variancePositive = (batch.variance || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/batches")}
          className="mt-1 p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{batch.batchName}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getBatchStatusColor(batch.status)}`}>
              {statusIcon[batch.status as BatchStatus]}
              {batch.status}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Imported {new Date(batch.importDate || batch.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            {batch.fileName ? ` · ${batch.fileName}` : ""}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCompactCurrency(batch.currentTotal || 0)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Projects</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{uniqueProjects}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Variance</p>
          <p className={`text-2xl font-bold mt-1 flex items-center gap-1 ${variancePositive ? "text-green-600" : "text-red-500"}`}>
            {variancePositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {variancePositive ? "+" : ""}{formatCompactCurrency(batch.variance || 0)}
          </p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Revenue by Project</h2>
          <p className="text-xs text-slate-400 mt-0.5">Monthly breakdown for all projects in this batch</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 min-w-[140px]">Project ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[200px]">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[140px]">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tower</th>
                {MONTHS.map(m => (
                  <th key={m} className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[80px]">{m}</th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[90px]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projectRows.length === 0 ? (
                <tr>
                  <td colSpan={17} className="text-center py-10 text-slate-400">No project data available</td>
                </tr>
              ) : (
                projectRows.map(({ project, months }) => {
                  const total = MONTHS.reduce((sum, _, i) => {
                    const rev = months[i + 1];
                    return sum + (rev?.currentSubmissionAmount || rev?.forecastAmount || 0);
                  }, 0);
                  return (
                    <tr key={project?.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono sticky left-0 bg-white">{project?.projectId || "—"}</td>
                      <td className="px-4 py-3 text-slate-800 font-medium max-w-[200px] truncate">{project?.projectDescription || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs truncate max-w-[140px]">{project?.customerDescription || "—"}</td>
                      <td className="px-4 py-3">
                        {project?.tower && (
                          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{project.tower}</span>
                        )}
                      </td>
                      {MONTHS.map((_, i) => {
                        const rev = months[i + 1];
                        const amount = rev?.currentSubmissionAmount || rev?.forecastAmount || 0;
                        const isEstimated = rev?.isEstimated;
                        return (
                          <td
                            key={i}
                            className={`px-3 py-3 text-right text-xs ${isEstimated ? "italic text-slate-400 bg-yellow-50" : "text-slate-700"}`}
                          >
                            {amount !== 0 ? formatCompactCurrency(amount) : <span className="text-slate-300">—</span>}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 text-xs">
                        {formatCompactCurrency(total)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-yellow-100 rounded border border-yellow-200" />
            <span className="italic">Estimated (system forecast)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-white rounded border border-slate-200" />
            <span>Actual (imported value)</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end">
        {batch.status === "Draft" && (
          <button
            onClick={() => statusMutation.mutate("Under Review")}
            disabled={statusMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            {statusMutation.isPending ? "Submitting..." : "Submit for Review"}
          </button>
        )}
        {batch.status === "Under Review" && (
          <button disabled className="bg-slate-100 text-slate-400 px-6 py-2.5 rounded-xl font-medium text-sm cursor-not-allowed">
            <Clock className="w-4 h-4 inline mr-1.5" />
            Pending PL Approval
          </button>
        )}
        {batch.status === "Approved PL" && (
          <button disabled className="bg-slate-100 text-slate-400 px-6 py-2.5 rounded-xl font-medium text-sm cursor-not-allowed">
            <Clock className="w-4 h-4 inline mr-1.5" />
            Pending PH Approval
          </button>
        )}
        {batch.status === "Locked" && (
          <button disabled className="bg-green-100 text-green-700 px-6 py-2.5 rounded-xl font-medium text-sm cursor-not-allowed">
            <Lock className="w-4 h-4 inline mr-1.5" />
            Locked
          </button>
        )}
      </div>
    </div>
  );
}