import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Lock, XCircle, Shield, TrendingUp, TrendingDown, ArrowRight, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCompactCurrency, getBatchStatusColor } from "@/lib/utils";
import { ImportBatch } from "@/types/index";

const API_BASE = "";

function BatchQueryPanel({ batchId }: { batchId: string }) {
  const queryClient = useQueryClient();

  const { data: batchQueries = [], isLoading } = useQuery({
    queryKey: ["batch-queries", batchId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/batch-queries/batch/${batchId}`);
      if (!res.ok) throw new Error("Failed to fetch batch queries");
      return res.json();
    },
  });

  const [newQuery, setNewQuery] = useState("");
  const raiseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/batch-queries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, query: newQuery.trim(), raisedBy: "PH" }),
      });
      if (!res.ok) throw new Error("Failed to raise query");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-queries", batchId] });
      queryClient.invalidateQueries({ queryKey: ["batches-ph"] });
      setNewQuery("");
      toast.success("PH query raised successfully.");
    },
    onError: () => toast.error("Failed to raise PH query"),
  });

  const openQueries = batchQueries.filter((query: any) => query.status !== "Resolved");

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">PH Query Workflow</h4>
          <p className="text-xs text-slate-500">Raise a query to PL and track its response</p>
        </div>
        {openQueries.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">{openQueries.length} open</span>
        )}
      </div>

      <div className="space-y-3">
        <textarea
          value={newQuery}
          onChange={(e) => setNewQuery(e.target.value)}
          rows={3}
          placeholder="Type a query for PL to resolve before approval..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
        />
        <div className="flex justify-end">
          <button
            onClick={() => raiseMutation.mutate()}
            disabled={!newQuery.trim() || raiseMutation.isPending}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {raiseMutation.isPending ? "Raising..." : "Raise Query"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading query history...</div>
      ) : batchQueries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">No queries raised yet for this batch.</div>
      ) : (
        <div className="space-y-3">
          {batchQueries.map((query: any) => (
            <div key={query.id} className={`rounded-2xl border p-3 shadow-sm ${query.status === "Resolved" ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/70"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${query.status === "Resolved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    PH
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700">Practice Head</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${query.status === "Resolved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {query.status === "Resolved" ? "Resolved" : "Awaiting PL Response"}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(query.raisedAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{query.query}</p>
                  </div>
                </div>
              </div>

              {query.response && (
                <div className="mt-3 ml-11 rounded-xl border border-emerald-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">PL</div>
                    <span className="text-xs font-semibold text-slate-700">PL Response</span>
                    <span className="text-[10px] text-slate-400">{query.respondedAt ? new Date(query.respondedAt).toLocaleString() : ""}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{query.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PHApproval() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [comment, setComment] = useState("");

  const { data: batches = [], isLoading } = useQuery<ImportBatch[]>({
    queryKey: ["batches-ph"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/batches?status=Approved PL`);
      if (!res.ok) throw new Error("Failed to fetch batches");
      return res.json();
    },
  });

  const { data: batchQuerySummary = [] } = useQuery({
    queryKey: ["batch-query-summary-ph"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/batch-queries/open`);
      if (!res.ok) throw new Error("Failed to fetch open batch queries");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`${API_BASE}/api/batches/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, { status }) => {
      toast.success(status === "Locked" ? "🔒 Batch approved and locked!" : "Batch returned to Practice Lead");
      queryClient.invalidateQueries({ queryKey: ["batches-ph"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedBatch(null);
      setComment("");
    },
    onError: () => toast.error("Failed to update batch status"),
  });

  return (
    <div className="space-y-6 px-8 py-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Practice Head Approval</h1>
        <p className="text-slate-600 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          Final approval step · Approved batches will be locked
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden py-10">
          <div className="text-center px-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-slate-100 flex items-center justify-center mx-auto mb-4 shadow-md">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">No batches awaiting final approval</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              All Practice Lead approved batches have been processed. Check back later for new submissions awaiting Practice Head review.
            </p>
            <button
              onClick={() => navigate("/batches")}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              View All Batches
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => {
            const variancePercent = batch.lastTotal ? ((batch.variance || 0) / batch.lastTotal) * 100 : 0;
            const isExpanded = selectedBatch?.id === batch.id;
            const openQueries = (batchQuerySummary || []).filter(
              (query: any) => query.batchId === batch.id && query.status !== "Resolved"
            );

            return (
              <div key={batch.id} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Main Card */}
                <div className="p-6 flex items-start gap-5">
                  {/* Left Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="text-lg font-bold text-slate-900">{batch.batchName}</h3>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        ✓ PL Approved
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                      📅 {new Date(batch.importDate || batch.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      {batch.fileName ? ` · 📄 ${batch.fileName}` : ""}
                    </p>

                    {/* Variance Analysis Mini-Cards */}
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200 mb-4">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Variance Analysis</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Last Total</p>
                          <p className="text-base font-bold text-slate-900 mt-1">{formatCompactCurrency(batch.lastTotal || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Current Total</p>
                          <p className="text-base font-bold text-slate-900 mt-1">{formatCompactCurrency(batch.currentTotal || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Variance</p>
                          <div className="flex items-center gap-1 mt-1">
                            {(batch.variance || 0) >= 0 ? (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <p className="text-base font-bold text-green-600">{formatCompactCurrency(Math.abs(batch.variance || 0))}</p>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                <p className="text-base font-bold text-red-600">${Math.abs(batch.variance || 0).toLocaleString()}</p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-xs text-slate-500 font-medium">Variance %</p>
                          <p className={`text-base font-bold mt-1 ${variancePercent >= 0 ? "text-purple-600" : "text-orange-600"}`}>
                            {variancePercent >= 0 ? "+" : ""}{variancePercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => navigate(`/batches/${batch.id}`)}
                      className="flex items-center gap-2 border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                  </div>
                </div>

                {/* Expandable Section */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-6 space-y-4">
                    {openQueries.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                        <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Open batch queries are blocking PH approval. Resolve them before locking the batch.</span>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Comments (optional)</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add final approval notes or feedback..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => setSelectedBatch(null)}
                        className="text-slate-600 hover:text-slate-900 font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => approveMutation.mutate({ id: batch.id, status: "Under Review" })}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-2 border border-orange-300 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Return to PL
                      </button>
                      <button
                        onClick={() => approveMutation.mutate({ id: batch.id, status: "Locked" })}
                        disabled={approveMutation.isPending || openQueries.length > 0}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-md"
                      >
                        <Lock className="w-4 h-4" />
                        {approveMutation.isPending ? "Locking..." : "Approve & Lock"}
                      </button>
                    </div>
                    <BatchQueryPanel batchId={batch.id} />
                  </div>
                )}

                {/* Collapsed Footer - Click to Expand */}
                {!isExpanded && (
                  <div
                    onClick={() => setSelectedBatch(batch)}
                    className="border-t border-slate-200 px-6 py-3 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-slate-600">Click to review and approve or return to Practice Lead</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}