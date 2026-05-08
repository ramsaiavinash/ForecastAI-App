import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TrendingUp,
  DiffIcon,
  Folder,
  ClipboardList,
  Trash2,
  Lock,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardSummary, ImportBatch } from "@/types/index";

const API_BASE = "/api";

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  loading = false,
}: {
  title: string;
  value: string;
  change?: string;
  changeLabel?: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-500">
          {Icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      {change && (
        <p className={`text-xs font-semibold ${change.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>
          {change} {changeLabel && <span className="text-slate-500 font-normal">{changeLabel}</span>}
        </p>
      )}
      {changeLabel && !change && (
        <p className="text-xs text-slate-500">{changeLabel}</p>
      )}
    </div>
  );
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);

  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      const res = await fetch(`${API_BASE}/data/clear`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to clear data");
      toast.success("All data cleared successfully");
      queryClient.refetchQueries({ queryKey: ["dashboard"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear data");
    } finally {
      setIsClearing(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Revenue Forecast Dashboard
          </h1>
          <p className="text-gray-600">
            FY 2026 · April Overview · Current submission period
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Data</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All batches, projects, and revenue data will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearData}
                disabled={isClearing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isClearing ? "Clearing..." : "Clear All Data"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="TOTAL REVENUE"
          value={data ? formatCurrency(data.totalRevenue) : "$0"}
          change={data ? formatPercent(data.variancePercent) : undefined}
          icon={<TrendingUp className="w-6 h-6" />}
          loading={isLoading}
        />
        <StatCard
          title="VARIANCE"
          value={data ? formatCurrency(data.variance) : "$0"}
          changeLabel="Above last period"
          icon={<DiffIcon className="w-6 h-6" />}
          loading={isLoading}
        />
        <StatCard
          title="ACTIVE PROJECTS"
          value={data ? data.activeProjects.toString() : "0"}
          changeLabel="In forecast"
          icon={<Folder className="w-6 h-6" />}
          loading={isLoading}
        />
        <StatCard
          title="PENDING APPROVALS"
          value={data ? data.pendingApprovals.toString() : "0"}
          changeLabel="Batches awaiting review"
          icon={<ClipboardList className="w-6 h-6" />}
          loading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Monthly Revenue Overview
          </h2>
          {isLoading ? (
            <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
              <div className="text-gray-500">Loading chart...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => { if (v >= 1000000) return `$${(v/1000000).toFixed(0)}M`; if (v >= 1000) return `$${(v/1000).toFixed(0)}K`; return `$${v}`; }} width={60} />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="actuals" fill="#3b82f6" name="Actuals" />
                <Bar dataKey="forecast" fill="#10b981" name="Forecast" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Batches */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Recent Batches
            </h2>
            <a
              href="/batches"
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {data?.recentBatches && data.recentBatches.length > 0 ? (
                data.recentBatches.map((batch: ImportBatch) => (
                  <div
                    key={batch.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        batch.status === "Locked"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {batch.status === "Locked" ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate max-w-[180px]">
                        {batch.batchName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(batch.createdAt || batch.importDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          batch.status === "Locked"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {batch.status}
                      </span>
                      <p
                        className={`text-sm font-semibold mt-1 ${
                          batch.variance >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {batch.lastTotal > 0 ? formatPercent((batch.variance / batch.lastTotal) * 100) : formatCompactCurrency(batch.variance)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No batches yet. Start by importing data.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}