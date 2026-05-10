import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Lock, Clock, CheckCircle, Shield,
  TrendingUp, TrendingDown, Save, X, Pencil, Search, Edit2, AlertCircle
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
  const [editingCell, setEditingCell] = useState<string | null>(null);

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
        <div className="h-32 bg-gradient-to-r from-slate-200 to-blue-200 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl" />
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
      {/* Premium Gradient Header Card */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative p-8 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => navigate("/batches")} 
              className="mt-1 p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{batch.batchName}</h1>
              <p className="text-slate-300 text-sm mt-2">
                📅 Imported {new Date(batch.importDate || batch.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                {batch.fileName ? ` · 📄 ${batch.fileName}` : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
              batch.status === "Draft" ? "bg-amber-500/20 text-amber-200 border border-amber-500/30" :
              batch.status === "Under Review" ? "bg-blue-500/20 text-blue-200 border border-blue-500/30" :
              batch.status === "Approved PL" ? "bg-purple-500/20 text-purple-200 border border-purple-500/30" :
              batch.status === "Locked" ? "bg-green-500/20 text-green-200 border border-green-500/30" :
              "bg-slate-500/20 text-slate-200 border border-slate-500/30"
            }`}>
              {batch.status === "Draft" && <Clock className="w-4 h-4" />}
              {batch.status === "Under Review" && <Clock className="w-4 h-4" />}
              {batch.status === "Approved PL" && <CheckCircle className="w-4 h-4" />}
              {batch.status === "Locked" && <Lock className="w-4 h-4" />}
              {batch.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Current Total - Green Blob */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="absolute bottom-2 right-4 w-24 h-24 rounded-full bg-emerald-200/8 blur-xl" />
          <div className="relative">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Total</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">{formatCompactCurrency(batch.currentTotal || 0)}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span>Latest Period</span>
            </div>
          </div>
        </div>

        {/* Last Total - Blue Blob */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="absolute bottom-2 right-4 w-24 h-24 rounded-full bg-emerald-200/8 blur-xl" />
          <div className="relative">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Last Total</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">{formatCompactCurrency(batch.lastTotal || 0)}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span>Previous Period</span>
            </div>
          </div>
        </div>

        {/* Variance - Purple Blob */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="absolute bottom-2 right-4 w-24 h-24 rounded-full bg-emerald-200/8 blur-xl" />
          <div className="relative">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Variance</p>
            <div className={`flex items-center gap-2 mt-3 text-3xl font-extrabold ${variancePositive ? "text-emerald-600" : "text-red-600"}`}>
              {variancePositive ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
              <span>{formatCompactCurrency(batch.variance || 0)}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: variancePositive ? "#059669" : "#dc2626" }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: variancePositive ? "#059669" : "#dc2626" }} />
              <span>{variancePositive ? "Positive" : "Negative"} Change</span>
            </div>
          </div>
        </div>

        {/* Projects Count - Orange Blob */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow p-6">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="absolute bottom-2 right-4 w-24 h-24 rounded-full bg-emerald-200/8 blur-xl" />
          <div className="relative">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Projects</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">{projectRows.length}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span>Active Projects</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-bold text-lg text-slate-900">Monthly Revenue by Project</h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-4">
              <span>📊 {projectRows.length} projects</span>
              <span>📈 {revenues.length} records</span>
              <span className="font-bold">💰 Grand Total: ${Math.round(grandTotal).toLocaleString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-48 shadow-sm"
              />
            </div>

            {/* Edit Controls */}
            {!isEditing && canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                <Edit2 className="w-4 h-4" /> Edit Revenue
              </button>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setIsEditing(false); setEditedAmounts({}); }}
                  className="flex items-center gap-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={() => saveRevenueMutation.mutate()}
                  disabled={saveRevenueMutation.isPending}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  {saveRevenueMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300">
                {/* Project Info columns */}
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide sticky left-0 bg-slate-100 border-r border-slate-300 min-w-[60px]">Tower</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[100px]">Market</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[100px]">Mkt Unit</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[130px]">Bus Unit</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[100px]">Vertical</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[130px]">Parent Cust</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[80px]">Cust ID</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[150px]">Customer</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[100px]">Project ID</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[180px]">Project</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[80px]">Bill</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[130px]">Sub Practice</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[80px]">Category</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[80px]">EDL</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[80px]">PDL</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[100px]">PM</th>
                <th className="px-3 py-3 text-left font-bold text-slate-700 uppercase tracking-wide min-w-[90px]">End Date</th>
                {/* Month columns */}
                {MONTHS.map((m, i) => (
                  <th key={m} className={`px-2.5 py-3 text-center font-bold uppercase tracking-wide min-w-[85px] ${i < 4 ? "bg-blue-100 text-blue-900" : "bg-green-100 text-green-900"}`}>
                    {m}
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-bold text-slate-700 uppercase tracking-wide min-w-[90px] bg-slate-200">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {projectRows.length === 0 ? (
                <tr>
                  <td colSpan={30} className="text-center py-16 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      <span>{search ? "No projects match your search" : "No project data available"}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                projectRows.map(({ project, months }) => {
                  const projectId = project?.id || "";
                  const total = MONTHS.reduce((sum, _, i) => sum + getAmount(projectId, i+1, months[i+1]), 0);

                  return (
                    <tr key={projectId} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Info cells */}
                      <td className="px-3 py-3 sticky left-0 bg-white group-hover:bg-blue-50 border-r border-slate-200">
                        {project?.tower ? <span className="bg-slate-700 text-white px-2 py-1 rounded text-xs font-bold">{project.tower}</span> : "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600 font-medium">{project?.market || "—"}</td>
                      <td className="px-3 py-3 text-slate-600">{project?.marketUnit || "—"}</td>
                      <td className="px-3 py-3 text-slate-600 truncate max-w-[130px]" title={project?.businessUnit}>{project?.businessUnit || "—"}</td>
                      <td className="px-3 py-3 text-slate-600 truncate max-w-[100px]" title={project?.vertical}>{project?.vertical || "—"}</td>
                      <td className="px-3 py-3 text-slate-600 truncate max-w-[130px]" title={project?.parentCustomer}>{project?.parentCustomer || "—"}</td>
                      <td className="px-3 py-3 text-slate-500 font-mono text-xs">{project?.customerId || "—"}</td>
                      <td className="px-3 py-3 text-slate-700 truncate max-w-[150px]" title={project?.customerDescription}>{project?.customerDescription || "—"}</td>
                      <td className="px-3 py-3 text-emerald-600 font-mono text-xs font-bold">{project?.projectId || "—"}</td>
                      <td className="px-3 py-3 text-slate-800 font-semibold truncate max-w-[180px]" title={project?.projectDescription}>{project?.projectDescription || "—"}</td>
                      <td className="px-3 py-3 text-slate-500 text-xs truncate max-w-[80px]" title={project?.projectBillability}>{project?.projectBillability || "—"}</td>
                      <td className="px-3 py-3 text-slate-500 truncate max-w-[130px]" title={project?.subPractice}>{project?.subPractice || "—"}</td>
                      <td className="px-3 py-3">
                        {project?.category ? (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${project.category === "Backlog" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {project.category}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-xs truncate max-w-[80px]" title={project?.edlName}>{project?.edlName || "—"}</td>
                      <td className="px-3 py-3 text-slate-500 text-xs truncate max-w-[80px]" title={project?.pdlName}>{project?.pdlName || "—"}</td>
                      <td className="px-3 py-3 text-slate-600 truncate max-w-[100px]" title={project?.pmName}>{project?.pmName || "—"}</td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {project?.projectEndDate
                          ? new Date(project.projectEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
                          : "—"}
                      </td>

                      {/* Month cells */}
                      {MONTHS.map((_, i) => {
                        const month = i + 1;
                        const rev = months[month];
                        const amount = getAmount(projectId, month, rev);
                        const isEstimated = rev?.isEstimated;
                        const isPast = month <= 4;
                        const cellKey = `${projectId}-${month}`;
                        const isCurrentCell = editingCell === cellKey;

                        if (isEditing && !isPast && !isLocked) {
                          // Editable cell
                          return (
                            <td key={i} className="px-2 py-2 bg-green-50 border border-green-200">
                              <input
                                type="number"
                                value={editedAmounts[projectId]?.[month] ?? amount}
                                onChange={e => handleAmountChange(projectId, month, e.target.value)}
                                className="w-full text-right text-sm border border-green-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white font-semibold"
                              />
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={i} 
                            className={`px-2.5 py-3 text-right whitespace-nowrap font-semibold ${
                              isPast ? "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 border-r border-blue-200" :
                              isEstimated ? "bg-yellow-50 text-slate-400 italic border-r border-yellow-200" :
                              "bg-gradient-to-br from-green-50 to-green-100 text-slate-900 border-r border-green-200"
                            }`}
                          >
                            <span className={isEstimated ? "text-slate-400 italic" : ""}>
                              ${amount.toLocaleString()}
                            </span>
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="px-3 py-3 text-right font-bold text-slate-900 bg-gradient-to-br from-slate-100 to-slate-200 whitespace-nowrap border-l-2 border-slate-300">
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
                <tr className="bg-gradient-to-r from-slate-200 to-slate-300 border-t-4 border-slate-400 font-bold text-slate-900">
                  <td colSpan={17} className="px-3 py-4 sticky left-0 bg-gradient-to-r from-slate-200 to-slate-300 font-bold text-lg text-slate-900 border-r-2 border-slate-400">
                    🎯 GRAND TOTAL ({projectRows.length} projects)
                  </td>
                  {MONTHS.map((_, i) => {
                    const monthTotal = projectRows.reduce((sum, { project, months }) => {
                      return sum + getAmount(project?.id || "", i+1, months[i+1]);
                    }, 0);
                    return (
                      <td key={i} className={`px-2.5 py-4 text-center font-bold text-lg ${i < 4 ? "bg-blue-200 text-blue-900" : "bg-green-200 text-green-900"}`}>
                        ${monthTotal.toLocaleString()}
                      </td>
                    );
                  })}
                  <td className="px-3 py-4 text-center font-bold text-lg text-slate-900 bg-gradient-to-r from-slate-300 to-slate-400 border-l-2 border-slate-400">
                    ${Math.round(grandTotal).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Table Legend & Info */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 rounded border-2 border-blue-400" />
              <span className="text-xs text-slate-600 font-medium">Jan–Apr: Actuals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-200 rounded border-2 border-yellow-400" />
              <span className="text-xs text-slate-600 font-medium italic">Estimated (Forecast)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 rounded border-2 border-green-400" />
              <span className="text-xs text-slate-600 font-medium">May–Dec: Forecast</span>
            </div>
          </div>
          {canEdit &&  (
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${isEditing ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
              {isEditing ? "✏️ Editing — Click Save to confirm" : "📝 Click 'Edit Revenue' to modify forecast"}
            </span>
          )}
        </div>
      </div>

      {/* Premium Action Buttons Section */}
      <div className="flex justify-end gap-3 items-center flex-wrap">
        <div className="text-xs text-slate-500">
          Status: <span className="font-semibold text-slate-700">{batch.status}</span>
        </div>
        
        {batch.status === "Draft" && (
          <button
            onClick={() => statusMutation.mutate("Under Review")}
            disabled={statusMutation.isPending}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            {statusMutation.isPending ? "Submitting..." : "Submit for PL Review"}
          </button>
        )}
        
        {batch.status === "Under Review" && (
          <button 
            disabled 
            className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 px-6 py-3 rounded-xl font-semibold text-sm cursor-not-allowed border border-amber-200 shadow-sm"
          >
            <Clock className="w-4 h-4" /> 
            Pending PL Approval
          </button>
        )}
        
        {batch.status === "Approved PL" && (
          <button 
            disabled 
            className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 px-6 py-3 rounded-xl font-semibold text-sm cursor-not-allowed border border-purple-200 shadow-sm"
          >
            <Clock className="w-4 h-4" /> 
            Pending PH Approval
          </button>
        )}
        
        {batch.status === "Locked" && (
          <button 
            disabled 
            className="flex items-center gap-2 bg-gradient-to-r from-green-100 to-green-50 text-green-700 px-6 py-3 rounded-xl font-semibold text-sm cursor-not-allowed border border-green-200 shadow-sm"
          >
            <Lock className="w-4 h-4" /> 
            ✓ Locked
          </button>
        )}
      </div>
    </div>
  );
}