import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Lock, FileDown, CheckSquare, Square, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCompactCurrency } from "@/lib/utils";
import { ImportBatch } from "@/types/index";

const API_BASE = "";
const MONTH_KEYS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const MONTH_LABELS = ["Jan'26 Forecast","Feb'26 Forecast","Mar'26 Forecast","Apr'26 Forecast","May'26 Forecast","Jun'26 Forecast","Jul'26 Forecast","Aug'26 Forecast","Sep'26 Forecast","Oct'26 Forecast","Nov'26 Forecast","Dec'26 Forecast"];

export default function Export() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const { data: batches = [], isLoading } = useQuery<ImportBatch[]>({
    queryKey: ["batches-locked"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/batches?status=Locked`);
      if (!res.ok) throw new Error("Failed to fetch locked batches");
      return res.json();
    },
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(batches.map(b => b.id)));
  const clearAll = () => setSelected(new Set());

  const exportBatch = async (batch: ImportBatch) => {
    const res = await fetch(`${API_BASE}/api/batches/${batch.id}`);
    const data = await res.json();
    const revenues = data.revenues || [];
    const projects = data.projects || [];

    const projectMap = new Map<string, Record<number, any>>();
    for (const rev of revenues) {
      if (!projectMap.has(rev.projectId)) projectMap.set(rev.projectId, {});
      projectMap.get(rev.projectId)![rev.month] = rev;
    }

    const headers = [
      "Tower","Markets Description","Market Unit Description","Business Unit Description",
      "Vertical Description","Parent Customer","Customer ID","Customer Description",
      "Project ID","Project Description","Project Billability","Sub Practice Desc","Category",
      "Jan PPM","EDL ID","EDL Name","PDL ID","PDL Name","PM ID","PM Name",
      "Opportunity ID","Opportunity Name","Project end date","SO ID",
      ...MONTH_LABELS,
      "FY'26 Current Submission","Last Vs Current Submission","Reasons"
    ];

    const rows = projects.map((project: any) => {
      const months = projectMap.get(project.id) || {};
      const monthValues = MONTH_KEYS.map((_, i) => {
        const rev = months[i + 1];
        return Number(rev?.amount || 0);
      });
      const currentTotal = monthValues.reduce((a, b) => a + b, 0);
      return [
        project.tower || "", project.market || "", project.marketUnit || "",
        project.businessUnit || "", project.vertical || "", project.parentCustomer || "",
        project.customerId || "", project.customerDescription || "",
        project.projectId || "", project.projectDescription || "",
        project.projectBillability || "", project.subPractice || "", project.category || "",
        project.janPPM || 0, project.edlId || "", project.edlName || "",
        project.pdlId || "", project.pdlName || "", project.pmId || "", project.pmName || "",
        project.opportunityId || "", project.opportunityName || "",
        project.projectEndDate ? new Date(project.projectEndDate).toLocaleDateString("en-GB") : "",
        project.soId || "",
        ...monthValues,
        currentTotal, 0, ""
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.batchName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSelected = async () => {
    setExporting(true);
    try {
      const selectedBatches = batches.filter(b => selected.has(b.id));
      for (const batch of selectedBatches) await exportBatch(batch);
      toast.success(`${selectedBatches.length} batch${selectedBatches.length > 1 ? "es" : ""} exported successfully!`);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const totalValue = batches
    .filter(b => selected.has(b.id))
    .reduce((sum, b) => sum + Number(b.currentTotal || 0), 0);

  return (
    <div className="space-y-5 px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Export Data</h1>
          <p className="text-sm text-slate-500 mt-1">Export locked batches to CSV format matching the original structure</p>
        </div>
        {batches.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm text-center">
            <p className="text-xl font-bold text-slate-900">{batches.length}</p>
            <p className="text-xs text-slate-500">locked batch{batches.length !== 1 ? "es" : ""}</p>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <span className="font-semibold">Only locked batches can be exported.</span> To export a batch, complete the full approval workflow: Submit → PL Approve → PH Approve & Lock.
        </div>
      </div>

      {/* Batch List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Available Batches</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select batches to export</p>
          </div>
          {batches.length > 0 && (
            <div className="flex items-center gap-3">
              <button onClick={selectAll} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                <CheckSquare className="w-4 h-4" /> Select All
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={clearAll} className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
                Clear
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : batches.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No locked batches available</p>
            <p className="text-slate-400 text-sm mt-1">Batches must be approved and locked before they can be exported</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {batches.map((batch) => (
              <div
                key={batch.id}
                onClick={() => toggleSelect(batch.id)}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-all ${
                  selected.has(batch.id)
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <div className="flex-shrink-0">
                  {selected.has(batch.id)
                    ? <CheckSquare className="w-5 h-5 text-blue-600" />
                    : <Square className="w-5 h-5 text-slate-300" />
                  }
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 truncate">{batch.batchName}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                      Locked
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(batch.importDate || batch.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {batch.fileName ? ` · ${batch.fileName}` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-900">{formatCompactCurrency(batch.currentTotal || 0)}</p>
                  <p className="text-xs text-slate-400">Current Total</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Footer */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">
              {selected.size} of {batches.length} batch{batches.length !== 1 ? "es" : ""} selected
              {selected.size > 0 && <span className="text-blue-600 ml-2">· {formatCompactCurrency(totalValue)}</span>}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">CSV files will download automatically</p>
          </div>
          <button
            onClick={handleExportSelected}
            disabled={selected.size === 0 || exporting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export Selected"}
          </button>
        </div>
      </div>
    </div>
  );
}
