import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Lock } from "lucide-react";
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
      "Oppurtunity ID","Oppurtunity Name","Project end date","SO ID",
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
      const lastTotal = MONTH_KEYS.reduce((sum, _, i) => sum + (0), 0);
      const variance = currentTotal - lastTotal;

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
        currentTotal, variance, ""
      ];
    });

    const allRows: (string | number)[][] = [
      headers as (string | number)[],
      ...(rows as (string | number)[][])
    ];
    const csvContent = allRows
      .map((row: (string | number)[]) =>
        row.map((v: string | number) => `"${String(v).replace(/"/g, '""')}"` ).join(",")
      )
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
      for (const batch of selectedBatches) {
        await exportBatch(batch);
      }
      toast.success(`${selectedBatches.length} batch${selectedBatches.length > 1 ? "es" : ""} exported successfully!`);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Export Data</h1>
        <p className="text-sm text-slate-500 mt-1">Export locked batches to Excel format matching the original structure</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Available Batches</h2>
            <p className="text-xs text-slate-400 mt-0.5">Only locked batches can be exported</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={selectAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Select All
            </button>
            <button onClick={clearAll} className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
              Clear
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : batches.length === 0 ? (
          <div className="p-12 text-center">
            <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No locked batches available</p>
            <p className="text-slate-400 text-sm mt-1">Batches must be approved and locked before they can be exported</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {batches.map((batch) => (
              <div
                key={batch.id}
                onClick={() => toggleSelect(batch.id)}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selected.has(batch.id) ? "bg-blue-50" : "hover:bg-slate-50"}`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(batch.id)}
                  onChange={() => toggleSelect(batch.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 truncate">{batch.batchName}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      <Lock className="w-2.5 h-2.5 inline mr-0.5" />Locked
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {new Date(batch.importDate || batch.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {batch.fileName ? ` · ${batch.fileName}` : ""}
                  </p>
                </div>
                <p className="font-semibold text-slate-900">{formatCompactCurrency(batch.currentTotal || 0)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Summary */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900">{selected.size} batch{selected.size !== 1 ? "es" : ""} selected</p>
          <p className="text-xs text-slate-400 mt-0.5">Export will generate CSV files in original format</p>
        </div>
        <button
          onClick={handleExportSelected}
          disabled={selected.size === 0 || exporting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Export Selected"}
        </button>
      </div>
    </div>
  );
}