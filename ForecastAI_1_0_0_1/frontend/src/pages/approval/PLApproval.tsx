import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, ArrowRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatCompactCurrency, getBatchStatusColor } from "@/lib/utils";
import { ImportBatch } from "@/types/index";

const API_BASE = "";

function BatchQueryAudit({ batchId }: { batchId: string }) {
  const queryClient = useQueryClient();

  const { data: queries = [], isLoading } = useQuery({
    queryKey: ["batch-queries", batchId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/batch-queries/batch/${batchId}`);
      if (!res.ok) throw new Error("Failed to fetch batch queries");
      return res.json();
    },
  });

  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [showResponseForm, setShowResponseForm] = useState<Record<string, boolean>>({});

  const responseMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const res = await fetch(`${API_BASE}/api/batch-queries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, respondedBy: "PL", status: "Resolved" }),
      });
      if (!res.ok) throw new Error("Failed to respond to query");
      return res.json();
    },
    onSuccess: (_, { id }) => {
      toast.success("PH query responded successfully.");
      setShowResponseForm((prev) => ({ ...prev, [id]: false }));
      setResponseText((prev) => ({ ...prev, [id]: "" }));
      queryClient.invalidateQueries({ queryKey: ["batch-queries", batchId] });
      queryClient.invalidateQueries({ queryKey: ["batch-query-summary-pl"] });
      queryClient.invalidateQueries({ queryKey: ["batch-query-summary-ph"] });
      queryClient.invalidateQueries({ queryKey: ["batches-pl"] });
    },
    onError: () => toast.error("Failed to respond to PH query"),
  });

  if (isLoading) return <div className="mt-4 text-sm text-slate-500">Loading PH audit trail...</div>;

  const phQueries = queries.filter((query: any) => query.raisedBy === "PH");

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">PH Queries</h4>
        <span className="text-xs text-slate-500">{phQueries.length} total</span>
      </div>

      {phQueries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">No PH queries on this batch.</div>
      ) : (
        phQueries.map((query: any) => (
          <div key={query.id} className={`rounded-2xl border p-4 shadow-sm ${query.status === "Resolved" ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/80"}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${query.status === "Resolved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                PH
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">Practice Head</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${query.status === "Resolved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {query.status === "Resolved" ? "Resolved" : "Open"}
                  </span>
                  <span className="text-[11px] text-slate-400">{new Date(query.raisedAt).toLocaleString()}</span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-700">{query.query}</p>

                {query.response && (
                  <div className="mt-3 ml-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">PL</div>
                      <span className="text-xs font-semibold text-slate-700">PL Response</span>
                      <span className="text-[10px] text-slate-400">{query.respondedAt ? new Date(query.respondedAt).toLocaleString() : ""}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{query.response}</p>
                  </div>
                )}

                {query.status !== "Resolved" && !showResponseForm[query.id] && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setShowResponseForm((prev) => ({ ...prev, [query.id]: true }))}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      Respond
                    </button>
                  </div>
                )}

                {query.status !== "Resolved" && showResponseForm[query.id] && (
                  <div className="mt-3 ml-3 space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <textarea
                      value={responseText[query.id] || ""}
                      onChange={(e) => setResponseText((prev) => ({ ...prev, [query.id]: e.target.value }))}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                      placeholder="Enter your response to the PH query..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowResponseForm((prev) => ({ ...prev, [query.id]: false }))}
                        className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => responseMutation.mutate({ id: query.id, response: responseText[query.id] || "" })}
                        disabled={!responseText[query.id] || responseMutation.isPending}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {responseMutation.isPending ? "Responding..." : "Submit Response"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function PLApproval() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [comment, setComment] = useState("");

  const { data: batches = [], isLoading } = useQuery<ImportBatch[]>({
    queryKey: ["batches-pl"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/batches?status=Under Review`);
      if (!res.ok) throw new Error("Failed to fetch batches");
      return res.json();
    },
  });

  const openBatchQueryMap = useQuery({
    queryKey: ["batch-query-summary-pl"],
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
      toast.success(status === "Approved PL" ? "Batch approved!" : "Batch rejected and returned to Draft");
      queryClient.invalidateQueries({ queryKey: ["batches-pl"] });
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
        <h1 className="text-3xl font-bold text-slate-900">Practice Lead Approval</h1>
        <p className="text-slate-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          Review and approve forecast submissions before Practice Head review
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden py-10">
          <div className="text-center px-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">No pending approvals</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              All forecast submissions have been reviewed. Check back later for new submissions awaiting Practice Lead approval.
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
            const openPhQueries = (openBatchQueryMap.data || []).filter(
              (query: any) => query.batchId === batch.id && query.raisedBy === "PH" && query.status !== "Resolved"
            );

            return (
              <div key={batch.id} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Main Card */}
                <div className="p-6 flex items-start gap-5">
                  {/* Left Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="text-lg font-bold text-slate-900">{batch.batchName}</h3>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        🔄 Pending Review
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                      📅 {new Date(batch.importDate || batch.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      {batch.fileName ? ` · 📄 ${batch.fileName}` : ""}
                    </p>

                    {/* Stat Mini-Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Current Total</p>
                        <p className="text-lg font-extrabold text-slate-900 mt-1">{formatCompactCurrency(batch.currentTotal || 0)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Last Total</p>
                        <p className="text-lg font-extrabold text-blue-900 mt-1">{formatCompactCurrency(batch.lastTotal || 0)}</p>
                      </div>
                      <div className={`bg-gradient-to-br rounded-xl p-3 border ${(batch.variance || 0) >= 0 ? "from-green-50 to-green-100 border-green-200" : "from-red-50 to-red-100 border-red-200"}`}>
                        <p className={`text-xs font-bold uppercase tracking-wide ${(batch.variance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>Variance</p>
                        <p className={`text-lg font-extrabold mt-1 flex items-center gap-1 ${(batch.variance || 0) >= 0 ? "text-green-900" : "text-red-900"}`}>
                          {(batch.variance || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {formatCompactCurrency(batch.variance || 0)}
                        </p>
                      </div>
                      <div className={`bg-gradient-to-br rounded-xl p-3 border ${variancePercent >= 0 ? "from-purple-50 to-purple-100 border-purple-200" : "from-orange-50 to-orange-100 border-orange-200"}`}>
                        <p className={`text-xs font-bold uppercase tracking-wide ${variancePercent >= 0 ? "text-purple-600" : "text-orange-600"}`}>Variance %</p>
                        <p className={`text-lg font-extrabold mt-1 ${variancePercent >= 0 ? "text-purple-900" : "text-orange-900"}`}>
                          {variancePercent >= 0 ? "+" : ""}{variancePercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
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
                    {openPhQueries.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                        <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {openPhQueries.length} open PH query{openPhQueries.length !== 1 ? "ies" : "y"} must be resolved before approving.</span>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Comments (optional)</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add comments for approval notes or rejection feedback..."
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
                        onClick={() => approveMutation.mutate({ id: batch.id, status: "Draft" })}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => approveMutation.mutate({ id: batch.id, status: "Approved PL" })}
                        disabled={approveMutation.isPending || openPhQueries.length > 0}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-md"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {approveMutation.isPending ? "Approving..." : "Approve"}
                      </button>
                    </div>
                    <BatchQueryAudit batchId={batch.id} />
                  </div>
                )}

                {/* Collapsed Footer - Click to Expand */}
                {!isExpanded && (
                  <div
                    onClick={() => setSelectedBatch(batch)}
                    className="border-t border-slate-200 px-6 py-3 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-slate-600">Click to review and approve/reject</span>
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