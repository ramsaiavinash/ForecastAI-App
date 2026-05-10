import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Lock, Clock, CheckCircle, Shield,
  TrendingUp, TrendingDown, Save, X, Pencil, Search
} from "lucide-react";
import { toast } from "sonner";
import { formatCompactCurrency, getBatchStatusColor } from "@/lib/utils";
import { BatchStatus } from "@/types/index";

const API_BASE = "";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmounts, setEditedAmounts] = useState<Record<string, Record<number, number>>>({});
  const [search, setSearch] = useState("");

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

  const saveRevenueMutation = useMutation({
    mutationFn: async () => {
      const updates: Promise<any>[] = [];
      for (const [projectId, months] of Object.entries(editedAmounts)) {
        for (const [month, amount] of Object.entries(months)) {
          const rev = revenues.find((r: any) => r.projectId === projectId && r.month === Number(month));
          if (rev) {
            updates.push(
              fetch(`${API_BASE}/api/revenues/${rev.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
              })
            );
          }
        }
      }
      await Promise.all(updates);
    },
    onSuccess: () => {
      toast.success("Changes saved!");
      setIsEditing(false);
      setEditedAmounts({});
      queryClient.invalidateQueries({ queryKey: ["batch", id] });
    },
    onError: () => toast.error("Failed to save changes"),
  });

  const batch = data?.batch;
  const revenues: any[] = data?.revenues || [];
  const projects: any[] = data?.projects || [];

  // Group revenues by projectId
  const projectMap = new Map<string, { project: any; months: Record<number, any> }>();
  for (const rev of revenues) {
    if (!projectMap.has(rev.projectId)) {
      const project = projects.find((p: any) => p.id === rev.projectId);
      projectMap.set(rev.projectId, { project, months: {} });
    }
    projectMap.get(rev.projectId)!.months[rev.month] = rev;
  }

  let projectRows = Array.from(projectMap.values());

  if (search) {
    const q = search.toLowerCase();
    projectRows = projectRows.filter(({ project }) =>
      project?.projectDescription?.toLowerCase().includes(q) ||
      project?.projectId?.toLowerCase().includes(q) ||
      project?.customerDescription?.toLowerCase().includes(q) ||
      project?.tower?.toLowerCase().includes(q) ||
      project?.pmName?.toLowerCase().includes(q)
    );
  }

  const getAmount = (projectId: string, month: number, rev: any) => {
    if (editedAmounts[projectId]?.[month] !== undefined) return editedAmounts[projectId][month];
    return Number(rev?.amount || 0);
  };

  const handleAmountChange = (projectId: string, month: number, value: string) => {
    const num = parseFloat(value) || 0;
    setEditedAmounts(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || {}), [month]: num }
    }));
  };

  const fmt = (v: number) => {
    if (v === 0) return "$0";
    if (Math.abs(v) >= 1_000_000) return `$${(v/1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v/1_000).toFixed(0)}K`;
    return `$${v.toLocaleString()}`;
  };

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
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!batch) return <div className="text-center text-slate-500 py-20">Batch not found</div>;

  const variancePositive = (batch.variance || 0) >= 0;
  const isLocked = batch.status === "Locked";
  const canEdit = batch.status === "Draft" && !isLocked;

  // Grand totals
  const grandTotal = projectRows.reduce((sum, { project, months }) => {
    return sum + MONTHS.reduce((s, _, i) => s + getAmount(project?.id || "", i+1, months[i+1]), 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate("/batches")} className="mt-1 p-2 rounded-xl hover:bg-slate-100 transition-colors">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Current Total</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCompactCurrency(batch.currentTotal || 0)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Last Total</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCompactCurrency(batch.lastTotal || 0)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Variance</p>
          <p className={`text-2xl font-bold mt-1 flex items-center gap-1 ${variancePositive ? "text-green-600" : "text-red-500"}`}>
            {variancePositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {variancePositive ? "+" : ""}{formatCompactCurrency(batch.variance || 0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Projects</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{projectRows.length}</p>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-slate-900">Monthly Revenue by Project</h2>
            <p className="text-xs text-slate-400 mt-0.5">{projectRows.length} projects · {revenues.length} records · Grand Total: {fmt(grandTotal)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 w-40"
              />
            </div>
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setIsEditing(false); setEditedAmounts({}); }}
                  className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  onClick={() => saveRevenueMutation.mutate()}
                  disabled={saveRevenueMutation.isPending}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saveRevenueMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {/* Project Info columns */}
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 border-r border-slate-200 min-w-[60px]">Tower</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[100px]">Market</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[100px]">Market Unit</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[130px]">Business Unit</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[100px]">Vertical</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[130px]">Parent Customer</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[80px]">Customer ID</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[150px]">Customer</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[100px]">Project ID</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[180px]">Project Description</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[80px]">Billability</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[130px]">Sub Practice</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[80px]">Category</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[80px]">EDL Name</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[80px]">PDL Name</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[100px]">PM Name</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[90px]">End Date</th>
                {/* Month columns */}
                {MONTHS.map((m, i) => (
                  <th key={m} className={`px-2 py-2.5 text-right font-semibold text-slate-500 uppercase tracking-wide min-w-[80px] ${i < 4 ? "bg-blue-50" : "bg-green-50"}`}>
                    {m}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right font-semibold text-slate-500 uppercase tracking-wide min-w-[90px] bg-slate-100">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectRows.length === 0 ? (
                <tr>
                  <td colSpan={30} className="text-center py-12 text-slate-400">
                    {search ? "No projects match your search" : "No project data available"}
                  </td>
                </tr>
              ) : (
                projectRows.map(({ project, months }) => {
                  const projectId = project?.id || "";
                  const total = MONTHS.reduce((sum, _, i) => sum + getAmount(projectId, i+1, months[i+1]), 0);

                  return (
                    <tr key={projectId} className="hover:bg-slate-50/50 transition-colors">
                      {/* Info cells */}
                      <td className="px-3 py-2 sticky left-0 bg-white border-r border-slate-100">
                        {project?.tower ? <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded text-xs font-medium">{project.tower}</span> : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{project?.market || "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{project?.marketUnit || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 truncate max-w-[130px]" title={project?.businessUnit}>{project?.businessUnit || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 truncate max-w-[100px]" title={project?.vertical}>{project?.vertical || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 truncate max-w-[130px]" title={project?.parentCustomer}>{project?.parentCustomer || "—"}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono">{project?.customerId || "—"}</td>
                      <td className="px-3 py-2 text-slate-700 truncate max-w-[150px]" title={project?.customerDescription}>{project?.customerDescription || "—"}</td>
                      <td className="px-3 py-2 text-blue-600 font-mono">{project?.projectId || "—"}</td>
                      <td className="px-3 py-2 text-slate-800 font-medium truncate max-w-[180px]" title={project?.projectDescription}>{project?.projectDescription || "—"}</td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-[80px]" title={project?.projectBillability}>{project?.projectBillability || "—"}</td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-[130px]" title={project?.subPractice}>{project?.subPractice || "—"}</td>
                      <td className="px-3 py-2">
                        {project?.category ? (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${project.category === "Backlog" ? "bg-blue-50 text-blue-700" : "bg-yellow-50 text-yellow-700"}`}>
                            {project.category}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-[80px]" title={project?.edlName}>{project?.edlName || "—"}</td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-[80px]" title={project?.pdlName}>{project?.pdlName || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 truncate max-w-[100px]" title={project?.pmName}>{project?.pmName || "—"}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                        {project?.projectEndDate
                          ? new Date(project.projectEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>

                      {/* Month cells */}
                      {MONTHS.map((_, i) => {
                        const month = i + 1;
                        const rev = months[month];
                        const amount = getAmount(projectId, month, rev);
                        const isEstimated = rev?.isEstimated;
                        const isPast = month <= 4;

                        if (isEditing && !isPast && !isLocked) {
                          return (
                            <td key={i} className="px-1 py-1 bg-green-50">
                              <input
                                type="number"
                                value={editedAmounts[projectId]?.[month] ?? amount}
                                onChange={e => handleAmountChange(projectId, month, e.target.value)}
                                className="w-[70px] text-right text-xs border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                              />
                            </td>
                          );
                        }

                        return (
                          <td key={i} className={`px-2 py-2 text-right whitespace-nowrap ${
                            isPast ? "bg-blue-50/40 text-slate-700" :
                            isEstimated ? "bg-yellow-50 text-slate-400 italic" :
                            "text-slate-700"
                          }`}>
                            {amount !== 0
                              ? <span className={isEstimated ? "text-slate-400" : ""}>${amount.toLocaleString()}</span>
                              : <span className="text-slate-300">$0</span>
                            }
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="px-3 py-2 text-right font-bold text-slate-900 bg-slate-50 whitespace-nowrap">
                        ${total.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Grand Total Row */}
            {projectRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                  <td colSpan={17} className="px-3 py-2.5 text-slate-700 font-semibold sticky left-0 bg-slate-100">
                    TOTAL ({projectRows.length} projects)
                  </td>
                  {MONTHS.map((_, i) => {
                    const monthTotal = projectRows.reduce((sum, { project, months }) => {
                      return sum + getAmount(project?.id || "", i+1, months[i+1]);
                    }, 0);
                    return (
                      <td key={i} className={`px-2 py-2.5 text-right font-bold ${i < 4 ? "bg-blue-100" : "bg-green-100"}`}>
                        ${monthTotal.toLocaleString()}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-slate-200">
                    ${grandTotal.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-50 rounded border border-blue-200" />
            <span>Jan–Apr: Actuals (read-only)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-yellow-50 rounded border border-yellow-200" />
            <span className="italic">Estimated (system forecast)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-50 rounded border border-green-200" />
            <span>May–Dec: Forecast</span>
          </div>
          {canEdit && (
            <span className="ml-auto text-blue-600">
              {isEditing ? "✏️ Editing mode — click Save when done" : "Click Edit to modify forecast values"}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
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
          <button disabled className="bg-slate-100 text-slate-400 px-6 py-2.5 rounded-xl font-medium text-sm cursor-not-allowed flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending PL Approval
          </button>
        )}
        {batch.status === "Approved PL" && (
          <button disabled className="bg-slate-100 text-slate-400 px-6 py-2.5 rounded-xl font-medium text-sm cursor-not-allowed flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending PH Approval
          </button>
        )}
        {batch.status === "Locked" && (
          <button disabled className="bg-green-100 text-green-700 px-6 py-2.5 rounded-xl font-medium text-sm cursor-not-allowed flex items-center gap-2">
            <Lock className="w-4 h-4" /> Locked
          </button>
        )}
      </div>
    </div>
  );
}