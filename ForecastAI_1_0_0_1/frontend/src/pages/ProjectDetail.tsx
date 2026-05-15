import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, MapPin, Target, Calendar, Users, TrendingUp, TrendingDown, FolderOpen } from "lucide-react";
import { formatCompactCurrency } from "@/lib/utils";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Send, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const API_BASE = "";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(/[, ]+/).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["bg-violet-500","bg-blue-500","bg-emerald-500","bg-orange-500","bg-pink-500"];
function getAvatarColor(name?: string) {
  if (!name) return "bg-slate-400";
  return AVATAR_COLORS[(name.charCodeAt(0) + name.charCodeAt(name.length-1)) % AVATAR_COLORS.length];
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/projects/${id}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!id,
  });

  const project = data?.project;
  const revenues: any[] = data?.revenues || [];
  const batches: any[] = data?.batches || [];

  const revenueMap = new Map<string, Map<number, any>>();
  for (const rev of revenues) {
    if (!revenueMap.has(rev.batchId)) revenueMap.set(rev.batchId, new Map());
    revenueMap.get(rev.batchId)!.set(rev.month, rev);
  }

  const totalRevenue = revenues.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const actualsRevenue = revenues.filter(r => !r.isEstimated).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const forecastRevenue = revenues.filter(r => r.isEstimated).reduce((sum, r) => sum + Number(r.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-2xl" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!project) return <div className="text-center text-slate-500 py-20">Project not found</div>;

  return (
    <div className="space-y-5 px-8 py-6">
      {/* Back Button */}
      <button onClick={() => navigate("/projects")} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      {/* Header Card - Dark Gradient */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #34d399, transparent)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        <div className="relative p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {project.tower && <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">{project.tower}</span>}
                  {project.category && <span className="bg-emerald-500/30 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{project.category}</span>}
                  {project.projectBillability && <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{project.projectBillability}</span>}
                </div>
                <h1 className="text-2xl font-bold text-white">{project.projectDescription}</h1>
                <p className="text-slate-400 font-mono text-sm mt-0.5">{project.projectId}</p>
                <p className="text-slate-300 text-sm mt-1">{project.customerDescription}</p>
              </div>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/10">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium flex items-center gap-1"><Building2 className="w-3 h-3" /> Business Unit</p>
              <p className="text-white font-semibold mt-1 text-sm">{project.businessUnit || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium flex items-center gap-1"><MapPin className="w-3 h-3" /> Market</p>
              <p className="text-white font-semibold mt-1 text-sm">{project.market || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium flex items-center gap-1"><Target className="w-3 h-3" /> Vertical</p>
              <p className="text-white font-semibold mt-1 text-sm">{project.vertical || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium flex items-center gap-1"><Calendar className="w-3 h-3" /> End Date</p>
              <p className="text-white font-semibold mt-1 text-sm">
                {project.projectEndDate ? new Date(project.projectEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Team */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Project Team</h2>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          {[
            { role: "Project Manager", name: project.pmName },
            { role: "Practice Delivery Lead", name: project.pdlName },
            { role: "Engagement Delivery Lead", name: project.edlName },
          ].map(({ role, name }) => (
            <div key={role} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${getAvatarColor(name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                {getInitials(name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{name || "NOT AVAILABLE"}</p>
                <p className="text-xs text-slate-400">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Revenue (YTD)", value: formatCompactCurrency(totalRevenue), color: "text-slate-900", blob: "bg-emerald-300/10" },
          { label: "Actuals", value: formatCompactCurrency(actualsRevenue), color: "text-blue-600", blob: "bg-blue-300/10" },
          { label: "Forecast / Estimated", value: formatCompactCurrency(forecastRevenue), color: "text-emerald-600", blob: "bg-emerald-300/10" },
        ].map(({ label, value, color, blob }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${blob} blur-2xl`} />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold relative">{label}</p>
            <p className={`text-2xl font-extrabold mt-2 relative ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="font-semibold text-slate-900">Monthly Revenue by Batch</h2>
              <p className="text-xs text-slate-400 mt-0.5">{batches.length} batch{batches.length !== 1 ? "es" : ""} · {revenues.length} revenue records</p>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        {revenues.length > 0 && (() => {
          const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const chartData = MONTHS_SHORT.map((month, idx) => {
            const monthRevs = revenues.filter((r: any) => r.month === idx + 1);
            const total = monthRevs.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
            return {
              month,
              actuals: idx < 4 ? total : 0,
              forecast: idx >= 4 ? total : 0,
            };
          });
          return (
            <div className="p-5 border-b border-slate-100">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={55} />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, ""]} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                  <Legend />
                  <Bar dataKey="actuals" fill="#6366f1" name="Actuals" radius={[4,4,0,0]} maxBarSize={40} />
                  <Bar dataKey="forecast" fill="#16a34a" name="Forecast" radius={[4,4,0,0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[200px]">Batch</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide min-w-[80px]">Status</th>
                {MONTHS.map((m, i) => (
                  <th key={m} className={`px-2 py-3 text-right font-semibold text-slate-500 uppercase min-w-[70px] ${i < 4 ? "bg-blue-50" : "bg-green-50"}`}>{m}</th>
                ))}
                <th className="px-4 py-3 text-right font-semibold text-slate-500 uppercase bg-slate-100 min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {batches.length === 0 ? (
                <tr><td colSpan={15} className="text-center py-12 text-slate-400">No revenue data available for this project</td></tr>
              ) : (
                batches.map(batch => {
                  const batchRevs = revenueMap.get(batch.id) || new Map();
                  const total = Array.from({length: 12}, (_, i) => Number(batchRevs.get(i+1)?.amount || 0)).reduce((a,b) => a+b, 0);
                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-medium text-slate-800 truncate max-w-[200px]">{batch.batchName}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          batch.status === "Locked" ? "bg-emerald-100 text-emerald-700" :
                          batch.status === "Approved PL" ? "bg-blue-100 text-blue-700" :
                          batch.status === "Under Review" ? "bg-yellow-100 text-yellow-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{batch.status}</span>
                      </td>
                      {MONTHS.map((_, i) => {
                        const rev = batchRevs.get(i+1);
                        const amount = Number(rev?.amount || 0);
                        return (
                          <td key={i} className={`px-2 py-2.5 text-right ${i < 4 ? "bg-blue-50/40" : rev?.isEstimated ? "bg-yellow-50 italic" : ""}`}>
                            {amount !== 0 ? <span className="text-slate-700">${amount.toLocaleString()}</span> : <span className="text-slate-300">—</span>}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900 bg-slate-50">${total.toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-50 rounded border border-blue-200" /><span>Jan–Apr: Actuals</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-50 rounded border border-yellow-200" /><span className="italic">Estimated</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-50 rounded border border-green-200" /><span>May–Dec: Forecast</span></div>
        </div>
      </div>
    {/* Comments Section */}
    <CommentsSection projectId={id!} projectData={data} />
    </div>
  );
}

function CommentsSection({ projectId, projectData }: { projectId: string; projectData: any }) {
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState("");
  const [commentedBy, setCommentedBy] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/comments/project/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!projectId,
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, comment, commentedBy }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
      setComment("");
      setCommentedBy("");
      setShowForm(false);
      toast.success("Comment added successfully!");
    },
    onError: () => toast.error("Failed to add comment"),
  });

  const resolveComment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved" }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
      toast.success("Comment marked as resolved!");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
      toast.success("Comment deleted!");
    },
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <div>
            <h2 className="font-semibold text-slate-900">Revenue Comments & Feedback</h2>
            <p className="text-xs text-slate-400 mt-0.5">{comments.length} comment{comments.length !== 1 ? "s" : ""} · Raise issues regarding revenue or forecast</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Add Comment
        </button>
      </div>

      {/* Add Comment Form */}
      {showForm && (
        <div className="p-5 border-b border-slate-100 bg-blue-50/50">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm">New Comment</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Your Name</label>
              <input
                value={commentedBy}
                onChange={e => setCommentedBy(e.target.value)}
                placeholder="Enter your name..."
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Comment</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Describe the revenue/forecast issue in detail..."
                rows={4}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white resize-none"
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setShowForm(false); setComment(""); setCommentedBy(""); }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => addComment.mutate()}
                disabled={!comment || !commentedBy || addComment.isPending}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {addComment.isPending ? "Submitting..." : "Submit Comment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="divide-y divide-slate-50">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-600">No comments yet</p>
            <p className="text-sm text-slate-400 mt-1">Click "Add Comment" to raise a revenue issue</p>
          </div>
        ) : (
          comments.map((c: any) => (
            <div key={c.id} className="p-5 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">
                    {c.commentedBy?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{c.commentedBy}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === "Resolved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {c.status === "Resolved" ? "✅ Resolved" : "⏳ Open"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(c.commentedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{c.comment}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {c.status !== "Resolved" && (
                    <button
                      onClick={() => resolveComment.mutate(c.id)}
                      title="Mark as Resolved"
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteComment.mutate(c.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
