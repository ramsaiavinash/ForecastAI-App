import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ProjectMaster {
  id: string;
  businessUnitDescription?: string | null;
}

interface RevenueRecord {
  id: string;
  projectId: string;
  month: number;
  year: number;
  amount?: number | null;
}

const fetchProjects = async () => {
  const response = await fetch("/api/project-masters");
  if (!response.ok) throw new Error("Failed to load projects");
  return response.json() as Promise<ProjectMaster[]>;
};

const fetchRevenueRecords = async () => {
  const response = await fetch("/api/revenue-records");
  if (!response.ok) throw new Error("Failed to load revenue records");
  return response.json() as Promise<RevenueRecord[]>;
};

export default function RevenueEntry() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [draftValues, setDraftValues] = useState<Record<string, number>>({});

  const { data: projects = [] } = useQuery(["projectMasters"], fetchProjects);
  const { data: records = [] } = useQuery(["revenueRecords"], fetchRevenueRecords);

  const projectRecords = useMemo(() => {
    return records.filter((record) => record.projectId === selectedProjectId);
  }, [records, selectedProjectId]);

  const existingByMonth = useMemo(() => {
    return projectRecords.reduce<Record<number, RevenueRecord>>((acc, record) => {
      acc[record.month] = record;
      return acc;
    }, {});
  }, [projectRecords]);

  const saveMutation = useMutation(async (payload: any) => {
    if (payload.id) {
      const response = await fetch(`/api/revenue-records/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update revenue record");
      return response.json();
    }
    const response = await fetch("/api/revenue-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to create revenue record");
    return response.json();
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(["revenueRecords"]);
    },
  });

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  const handleCellChange = (month: number, value: string) => {
    const key = `${selectedProjectId}-${month}`;
    setDraftValues((current) => ({
      ...current,
      [key]: Number(value),
    }));
  };

  const handleSaveRow = (month: number) => {
    if (!selectedProjectId) return;
    const key = `${selectedProjectId}-${month}`;
    const amount = draftValues[key];
    const existing = existingByMonth[month];
    const payload = {
      id: existing?.id,
      projectId: selectedProjectId,
      month,
      year: new Date().getFullYear(),
      amount,
      ownerId: "system",
      statecode: 0,
      statuscode: 1,
    };
    saveMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Revenue entry</h1>
        <p className="mt-2 text-sm text-slate-500">Edit the 12-month revenue grid for the selected project.</p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="block text-sm font-medium text-slate-700">Project</label>
          <select
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            className="max-w-2xl rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.businessUnitDescription ?? project.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">12-month revenue grid</h2>
            <p className="text-sm text-slate-500">Enter expected revenue for each month.</p>
          </div>
          <div className="text-sm text-slate-500">Project: {selectedProject?.businessUnitDescription ?? "None selected"}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Month</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {selectedProjectId ? (
                Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                  const existing = existingByMonth[month];
                  const key = `${selectedProjectId}-${month}`;
                  const draft = draftValues[key];
                  return (
                    <tr key={month} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{new Date(0, month - 1).toLocaleString("default", { month: "long" })}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={draft ?? existing?.amount ?? ""}
                          onChange={(event) => handleCellChange(month, event.target.value)}
                          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {existing ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Saved</span> : <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">New</span>}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleSaveRow(month)}
                          disabled={saveMutation.isLoading}
                          className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Select a project to edit revenue data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
