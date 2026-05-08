import { useQuery } from "@tanstack/react-query";

interface ImportBatch {
  id: string;
  fileName?: string | null;
  recordCount?: number | null;
  createdAt: string;
  status?: string | null;
}

const fetchImportBatches = async () => {
  const response = await fetch("/api/import-batches");
  if (!response.ok) throw new Error("Failed to load import history");
  return response.json() as Promise<ImportBatch[]>;
};

const formatStatus = (status?: string | null) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
};

export default function ImportHistory() {
  const { data = [], isLoading, isError } = useQuery(["importBatches"], fetchImportBatches);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Import history</h1>
        <p className="mt-2 text-sm text-slate-500">Review past spreadsheet imports and their status.</p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Import batches</h2>
            <p className="text-sm text-slate-500">Each row represents one upload batch.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">Loading import history...</div>
        ) : isError ? (
          <div className="rounded-3xl bg-rose-50 p-8 text-center text-rose-700">Unable to load import history.</div>
        ) : data.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">No import batches found yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Uploaded file</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Records</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{batch.fileName ?? "Untitled import"}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{batch.recordCount ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(batch.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        {formatStatus(batch.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
