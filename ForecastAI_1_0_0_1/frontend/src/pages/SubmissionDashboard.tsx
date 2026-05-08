import { useQuery } from "@tanstack/react-query";

interface SubmissionSummary {
  id: string;
  projectId?: string | null;
  name?: string | null;
  ownerId?: string | null;
  statecode?: number | null;
  statuscode?: number | null;
  createdAt: string;
}

const fetchSubmissions = async () => {
  const response = await fetch("/api/submissions");
  if (!response.ok) throw new Error("Failed to load submissions");
  return response.json() as Promise<SubmissionSummary[]>;
};

const statusLabel = (submission: SubmissionSummary) => {
  if (submission.statecode === 0) return "Active";
  if (submission.statecode === 1) return "Inactive";
  return "Unknown";
};

export default function SubmissionDashboard() {
  const { data = [], isLoading, isError } = useQuery(["submissions"], fetchSubmissions);

  const groupedByProject = data.reduce<Record<string, SubmissionSummary[]>>((acc, item) => {
    const key = item.projectId ?? "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Submission dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Browse current submission summaries across projects.</p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">Loading submissions...</div>
      ) : isError ? (
        <div className="rounded-3xl bg-rose-50 p-8 text-center text-rose-700">Unable to load submissions.</div>
      ) : (
        Object.entries(groupedByProject).map(([projectId, submissions]) => (
          <div key={projectId} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{projectId === "Unassigned" ? "Unassigned" : `Project ${projectId}`}</h2>
                <p className="text-sm text-slate-500">{submissions.length} submission{submissions.length === 1 ? "" : "s"}.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Submission</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Owner</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{submission.name ?? submission.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{submission.ownerId ?? "Unknown"}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{statusLabel(submission)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(submission.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
