import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Lock, XCircle, FileText, TrendingUp, TrendingDown, Shield, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatCompactCurrency, getBatchStatusColor } from "@/lib/utils";
import { ImportBatch } from "@/types/index";

const API_BASE = "";

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
      toast.success(status === "Locked" ? "Batch approved and locked!" : "Batch rejected");
      queryClient.invalidateQueries({ queryKey: ["batches-ph"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedBatch(null);
      setComment("");
    },
    onError: () => toast.error("Failed to update batch status"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Practice Head Approval</h1>
        <p className="text-sm text-slate-500 mt-1">Final approval step · Approved batches will be locked</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center" style={{ minHeight: "400px" }}>
          <div className="text-center px-8 py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No batches awaiting final approval</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
              All Practice Lead approved batches have been processed.
            </p>
            <button
              onClick={() => navigate("/batches")}
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              View All Batches
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div key={batch.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div
                className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setSelectedBatch(selectedBatch?.id === batch.id ? null : batch)}
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{batch.batchName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBatchStatusColor(batch.status)}`}>{batch.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(batch.importDate || batch.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {batch.fileName ? ` · ${batch.fileName}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Current Total</p>
                  <p className="font-bold text-slate-900">{formatCompactCurrency(batch.currentTotal || 0)}</p>
                  <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${(batch.variance || 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {(batch.variance || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {(batch.variance || 0) >= 0 ? "+" : ""}{formatCompactCurrency(batch.variance || 0)}
                  </p>
                </div>
              </div>

              {selectedBatch?.id === batch.id && (
                <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50">
                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Variance Analysis</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-400">Last Total</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{formatCompactCurrency(batch.lastTotal || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Current Total</p>
                        <p className="font-semibold text-slate-900 mt-0.5">{formatCompactCurrency(batch.currentTotal || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Variance</p>
                        <p className={`font-semibold mt-0.5 ${(batch.variance || 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {(batch.variance || 0) >= 0 ? "+" : ""}{formatCompactCurrency(batch.variance || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Comments (optional)</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add approval or rejection comments..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <button
                      onClick={() => approveMutation.mutate({ id: batch.id, status: "Draft" })}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => approveMutation.mutate({ id: batch.id, status: "Locked" })}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      {approveMutation.isPending ? "Locking..." : "Approve & Lock"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}