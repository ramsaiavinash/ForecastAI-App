import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, ArrowRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatCompactCurrency, getBatchStatusColor } from "@/lib/utils";
import { ImportBatch } from "@/types/index";

const API_BASE = "";

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
    <div className="space-y-6">
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
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden py-20">
          <div className="text-center px-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-md">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No pending approvals</h2>
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
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-md"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {approveMutation.isPending ? "Approving..." : "Approve"}
                      </button>
                    </div>
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