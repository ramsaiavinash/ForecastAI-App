import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload, X, CheckCircle, AlertCircle, AlertTriangle,
  Info, FileText, Settings2, Shield, Download
} from "lucide-react";
import { parseIndianNumber } from "@/lib/utils";
import { ValidationIssue, ParsedCSVRow } from "@/types/index";

const API_BASE = "";

const COLUMN_GROUPS = [
  {
    key: "required",
    label: "Required",
    description: "These columns are always imported",
    badge: "Required",
    badgeColor: "bg-blue-600 text-white",
    locked: true,
    columns: ["Project ID", "Project Description"],
  },
  {
    key: "projectInfo",
    label: "Project Info",
    description: "Additional project details",
    badge: null,
    badgeColor: "",
    locked: false,
    columns: [
      "Customer ID", "Customer Description", "Tower", "Market",
      "Business Unit", "Vertical", "Sub Practice", "Category", "Project End Date",
    ],
  },
  {
    key: "people",
    label: "People",
    description: "Team member assignments",
    badge: null,
    badgeColor: "",
    locked: false,
    columns: ["EDL ID", "EDL Name", "PDL ID", "PDL Name", "PM ID", "PM Name"],
  },
  {
    key: "revenue",
    label: "Revenue",
    description: "Monthly revenue values (always imported)",
    badge: "Revenue",
    badgeColor: "bg-green-100 text-green-700",
    locked: true,
    columns: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_KEYS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

function parseCSVText(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h.trim()] = values[idx]?.trim() || ""; });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current); current = "";
    } else { current += line[i]; }
  }
  result.push(current);
  return result;
}

function rowToParsedCSV(row: Record<string, string>): ParsedCSVRow {
  const getMonthForecast = (idx: number) => {
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return parseIndianNumber(row[`${monthNames[idx]}'26 Forecast`] || "0");
  };
  return {
    projectId: row["Project ID"] || "",
    projectDescription: row["Project Description"] || "",
    projectEndDate: row["Project end date"] || "",
    customerId: row["Customer ID"] || "",
    customerDescription: row["Customer Description"] || "",
    parentCustomer: row["Parent Customer"] || "",
    tower: row["Tower"] || "",
    market: row["Markets Description"] || "",
    marketUnit: row["Market Unit Description"] || "",
    businessUnit: row["Business Unit Description"] || "",
    vertical: row["Vertical Description"] || "",
    subPractice: row["Sub Practice Desc"] || "",
    category: row["Category"] || "",
    projectBillability: row["Project Billability"] || "",
    edlId: row["EDL ID"] || "",
    edlName: row["EDL Name"] || "",
    pdlId: row["PDL ID"] || "",
    pdlName: row["PDL Name"] || "",
    pmId: row["PM ID"] || "",
    pmName: row["PM Name"] || "",
    opportunityId: row["Oppurtunity ID"] || "",
    opportunityName: row["Oppurtunity Name"] || "",
    soId: row["SO ID"] || "",
    janPPM: parseIndianNumber(row["Jan PPM"] || "0"),
    jan: getMonthForecast(0), feb: getMonthForecast(1),
    mar: getMonthForecast(2), apr: getMonthForecast(3),
    may: getMonthForecast(4), jun: getMonthForecast(5),
    jul: getMonthForecast(6), aug: getMonthForecast(7),
    sep: getMonthForecast(8), oct: getMonthForecast(9),
    nov: getMonthForecast(10), dec: getMonthForecast(11),
    lastSubmissionTotal: parseIndianNumber(row["FY'26 Last Submission"] || "0"),
    janActual: parseIndianNumber(row["Jan'26 Actuals"] || "0"),
    currentSubmissionTotal: parseIndianNumber(row["FY'26 Current Submission"] || "0"),
    lastVsCurrent: parseIndianNumber(row["Last Vs Current Submission"] || "0"),
    reason: row["Reasons"] || "",
  };
}

function validateRows(rows: ParsedCSVRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  rows.forEach((row, idx) => {
    if (!row.projectId) issues.push({ row: idx + 2, field: "Project ID", message: "Project ID is required", severity: "error" });
    if (!row.projectDescription) issues.push({ row: idx + 2, field: "Project Description", message: "Project Description is required", severity: "error" });
    if (!row.projectEndDate) issues.push({ row: idx + 2, field: "Project End Date", message: "Project End Date is required", severity: "error" });
    if (!row.customerDescription) issues.push({ row: idx + 2, field: "Customer", message: "Missing customer description", severity: "warning" });
    const monthValues = MONTH_KEYS.map(k => (row as any)[k] as number);
    const zeroCount = monthValues.filter(v => v === 0).length;
    if (zeroCount >= 8) issues.push({ row: idx + 2, field: "Monthly Values", message: `${zeroCount} months have zero revenue`, severity: "warning" });
    monthValues.forEach((v, i) => {
      if (v < 0) issues.push({ row: idx + 2, field: MONTHS[i], message: `Negative value: ${v}`, severity: "warning" });
    });
  });
  return issues;
}

export function Import() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCSVRow[]>([]);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [batchName, setBatchName] = useState("");
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(COLUMN_GROUPS.flatMap(g => g.columns))
  );
  const [isValidated, setIsValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showWarnings, setShowWarnings] = useState(true);
  const [showErrors, setShowErrors] = useState(true);

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/imports/csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchName, fileName: file?.name, rows: parsedRows }),
      });
      if (!res.ok) throw new Error("Import failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Batch imported successfully!");
      navigate("/batches");
    },
    onError: (err: any) => toast.error(err.message || "Import failed"),
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setIsValidated(false);
    setIssues([]);
    try {
      const text = await f.text();
      const rawRows = parseCSVText(text);
      const parsed = rawRows.map(rowToParsedCSV);
      setParsedRows(parsed);
      setBatchName(f.name.replace(".csv", "").replace(/_/g, " "));
      setShowColumnDialog(true);
    } catch {
      toast.error("Failed to parse CSV file");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      const newIssues = validateRows(parsedRows);
      setIssues(newIssues);
      setIsValidated(true);
      setIsValidating(false);
      if (newIssues.filter(i => i.severity === "error").length === 0) {
        toast.success(`Validation passed! ${newIssues.filter(i => i.severity === "warning").length} warnings found.`);
      } else {
        toast.error(`Validation failed. ${newIssues.filter(i => i.severity === "error").length} errors found.`);
      }
    }, 800);
  };

  const exportValidationCSV = () => {
    const headers = ["Row", "Field", "Message", "Severity"];
    const rows = issues.map(i => [i.row, i.field, i.message, i.severity]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "validation_issues.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");

  const totalRevenue = parsedRows.reduce((sum, r) =>
    sum + MONTH_KEYS.reduce((s, k) => s + ((r as any)[k] as number || 0), 0), 0
  );
  const projectCount = new Set(parsedRows.map(r => r.projectId).filter(Boolean)).size;

  const formatCompact = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const canImport = file && parsedRows.length > 0 && errors.length === 0 && batchName.trim() !== "" && isValidated && !importMutation.isPending;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import Revenue Data</h1>
        <p className="text-sm text-slate-500 mt-1">Upload your CSV file to import revenue data to Dataverse</p>
      </div>

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">Import Guidelines</span>
        </div>
        <ul className="space-y-1 text-sm text-blue-700 ml-6 list-disc">
          <li>Supported format: CSV (.csv)</li>
          <li>Project ID, Project Description, and Project End Date are required for all rows</li>
          <li>Monthly columns (Jan-Dec) must contain numeric values</li>
          <li>All data will be saved directly to Dataverse</li>
        </ul>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-slate-900">Upload File</h2>
          <p className="text-sm text-slate-400 mt-0.5">Drag and drop your CSV file, or click to browse</p>
        </div>

        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>
            <p className="font-semibold text-slate-700">Drop your CSV file here</p>
            <p className="text-sm text-slate-400 mt-1">or click to browse · .csv supported</p>
          </div>
        ) : (
          <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB · {parsedRows.length} rows parsed</p>
            </div>
            <button
              onClick={() => { setFile(null); setParsedRows([]); setIssues([]); setIsValidated(false); }}
              className="p-1.5 rounded-lg hover:bg-green-100 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}

        {/* Data Preview after upload */}
        {parsedRows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">Data Preview</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{selectedColumns.size} columns</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowColumnDialog(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Edit Columns
                </button>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{projectCount} projects</span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Revenue</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCompact(totalRevenue)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Projects</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{projectCount}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Avg per Project</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{projectCount > 0 ? formatCompact(totalRevenue / projectCount) : "$0"}</p>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase">Project ID</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase">Description</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase">Customer</th>
                    {MONTHS.slice(0, 3).map(m => (
                      <th key={m} className="px-2 py-2 text-right font-semibold text-slate-500 uppercase">{m}</th>
                    ))}
                    <th className="px-3 py-2 text-right font-semibold text-slate-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {parsedRows.slice(0, 10).map((row, i) => {
                    const monthVals = MONTH_KEYS.map(k => (row as any)[k] as number || 0);
                    const total = monthVals.reduce((a, b) => a + b, 0);
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-blue-600">{row.projectId || "—"}</td>
                        <td className="px-3 py-2 text-slate-700 truncate max-w-[160px]">{row.projectDescription || "—"}</td>
                        <td className="px-3 py-2 text-slate-500 truncate max-w-[120px]">{row.customerDescription || "—"}</td>
                        {monthVals.slice(0, 3).map((v, mi) => (
                          <td key={mi} className="px-2 py-2 text-right text-slate-600">
                            {v !== 0 ? formatCompact(v) : <span className="text-slate-300">—</span>}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">{formatCompact(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-slate-400 p-3 border-t border-slate-100">
                Showing first 10 of {parsedRows.length} rows
              </p>
            </div>
          </div>
        )}

        {/* Data Validation Section */}
        {parsedRows.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isValidated ? (errors.length === 0 ? "bg-green-500" : "bg-red-500") : "border-2 border-slate-300"}`}>
                  {isValidated && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-sm font-semibold text-slate-700">Data Validation</span>
              </div>
              {isValidated && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${errors.length === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {errors.length === 0 ? <><CheckCircle className="w-3 h-3" /> Passed</> : <><AlertCircle className="w-3 h-3" /> {errors.length} errors found</>}
                </span>
              )}
            </div>

            {!isValidated ? (
              <div className="p-6 text-center">
                <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-4">Run validation to check your data before importing</p>
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isValidating ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Validating...</>
                  ) : (
                    <><Shield className="w-4 h-4" /> Validate Data</>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {/* Validation Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">{errors.length}</span>
                      Errors
                    </span>
                    <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <span className="w-4 h-4 rounded-full bg-yellow-400 text-white flex items-center justify-center text-xs">{warnings.length}</span>
                      Warnings
                    </span>
                    <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <span className="w-4 h-4 rounded-full bg-blue-400 text-white flex items-center justify-center text-xs">{infos.length}</span>
                      Info
                    </span>
                  </div>
                  {issues.length > 0 && (
                    <button
                      onClick={exportValidationCSV}
                      className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                  )}
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowErrors(!showErrors)}
                      className="flex items-center gap-2 text-sm font-semibold text-red-700 w-full text-left"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Errors ({errors.length})
                      <span className="ml-auto text-xs">{showErrors ? "▲" : "▼"}</span>
                    </button>
                    {showErrors && errors.slice(0, 5).map((e, i) => (
                      <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Row {e.row}</span>
                          <span className="text-xs font-semibold text-slate-700">{e.field}</span>
                        </div>
                        <p className="text-xs text-red-600 ml-5">{e.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowWarnings(!showWarnings)}
                      className="flex items-center gap-2 text-sm font-semibold text-yellow-700 w-full text-left"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Warnings ({warnings.length})
                      <span className="ml-auto text-xs">{showWarnings ? "▲" : "▼"}</span>
                    </button>
                    {showWarnings && warnings.slice(0, 5).map((w, i) => (
                      <div key={i} className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">Row {w.row}</span>
                          <span className="text-xs font-semibold text-slate-700">{w.field}</span>
                        </div>
                        <p className="text-xs text-yellow-700 ml-5">{w.message}</p>
                        <p className="text-xs text-yellow-500 ml-5 mt-0.5 flex items-center gap-1">
                          <span>💡</span> Verify this is intentional or if data is missing
                        </p>
                      </div>
                    ))}
                    {warnings.length > 5 && (
                      <p className="text-xs text-slate-400 text-center">...and {warnings.length - 5} more warnings</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Batch Name - only show after validation */}
        {isValidated && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Batch Name</label>
            <input
              value={batchName}
              onChange={e => setBatchName(e.target.value)}
              placeholder="e.g., April 2026 Forecast"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
        )}

        {/* Import Button */}
        {parsedRows.length > 0 && (
          !isValidated ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-400 py-3 rounded-xl font-medium cursor-not-allowed"
            >
              <Shield className="w-4 h-4" />
              Validate First
            </button>
          ) : errors.length > 0 ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-400 py-3 rounded-xl font-medium cursor-not-allowed"
            >
              <AlertCircle className="w-4 h-4" />
              Fix {errors.length} error{errors.length > 1 ? "s" : ""} before importing
            </button>
          ) : (
            <button
              onClick={() => importMutation.mutate()}
              disabled={!canImport}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-40"
            >
              {importMutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Import to Dataverse</>
              )}
            </button>
          )
        )}
      </div>

      {/* Column Selection Dialog */}
      {showColumnDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Select Columns to Import</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Choose which columns from your CSV file should be imported. Required columns cannot be deselected.</p>
                </div>
              </div>
              <button onClick={() => setShowColumnDialog(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {COLUMN_GROUPS.map(group => (
                <div key={group.key}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {group.badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${group.badgeColor}`}>{group.badge}</span>
                      )}
                      <span className="text-sm font-semibold text-slate-700">{group.label}</span>
                      <span className="text-xs text-slate-400">{group.description}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.columns.map(col => (
                      <div
                        key={col}
                        onClick={() => !group.locked && toggleColumn(col)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${group.locked ? "opacity-80 cursor-default" : "cursor-pointer hover:border-blue-200"} ${selectedColumns.has(col) ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50"}`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${selectedColumns.has(col) ? "bg-blue-600" : "bg-white border border-slate-300"}`}>
                          {selectedColumns.has(col) && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-700 flex-1">{col}</span>
                        <span className="text-xs text-slate-400">Detected</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-5 border-t border-slate-100">
              <span className="text-sm text-slate-500">{selectedColumns.size} of {COLUMN_GROUPS.flatMap(g => g.columns).length} columns selected</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowColumnDialog(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => setShowColumnDialog(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}