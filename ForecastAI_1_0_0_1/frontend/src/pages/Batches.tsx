import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, Plus, FileText, Clock, Lock,
  CheckCircle, Shield, Grid, List, TrendingUp, TrendingDown
} from "lucide-react";
import { formatCompactCurrency, getBatchStatusColor } from "@/lib/utils";
import { ImportBatch, BatchStatus } from "@/types/index";

const API_BASE = "";

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All Statuses", value: "" },
  { label: "Draft", value: "Draft" },
  { label: "Under Review", value: "Under Review" },
  { label: "Approved PL", value: "Approved PL" },
  { label: "Approved PH", value: "Approved PH" },
  { label: "Locked", value: "Locked" },
];

function StatusBadge({ status }: { status: BatchStatus }) {
  const icons: Record<BatchStatus, JSX.Element> = {
    Draft: <Clock className="w-3 h-3" />,
    "Under Review": <Clock className="w-3 h-3" />,
    "Approved PL": <CheckCircle className="w-3 h-3" />,
    "Approved PH": <Shield className="w-3 h-3" />,
    Locked: <Lock className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getBatchStatusColor(status)}`}>
      {icons[status]}
      {status}
    </span>
  );
}

function BatchCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-4 bg-slate-200 rounded w-20" />
          <div className="h-3 bg-slate-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export default function Batches() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const { data: batches = [], isLoading } = useQuery<ImportBatch[]>({
    queryKey: ["batches"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/batches`);
      if (!res.ok) throw new Error("Failed to fetch batches");
      return res.json();
    },
  });

  const filtered = batches.filter((b) => {
    const matchSearch =
      !search ||
      b.batchName.toLowerCase().includes(search.toLowerCase()) ||
      (b.fileName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Batch Review</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage imported forecast batches</p>
        </div>
        <button
          onClick={() => navigate("/import")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Import
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batches..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Batch List */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <BatchCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No batches found</p>
            <p className="text-slate-400 text-sm mt-1">
              {search || statusFilter ? "Try adjusting your filters" : "Import your first CSV file to get started"}
            </p>
          </div>
        ) : (
          filtered.map((batch) => (
            <div
              key={batch.id}
              onClick={() => navigate(`/batches/${batch.id}`)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate">{batch.batchName}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(batch.importDate || batch.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {batch.fileName ? ` · ${batch.fileName}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={batch.status as BatchStatus} />
                </div>
                <div className="flex items-end justify-between pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Total</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{formatCompactCurrency(batch.currentTotal || 0)}</p>
                  </div>
                  <div className={`text-right flex items-end gap-1 ${(batch.variance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {(batch.variance || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Variance</p>
                      <p className="text-lg font-bold">{(batch.variance || 0) >= 0 ? "+" : ""}{formatCompactCurrency(batch.variance || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}