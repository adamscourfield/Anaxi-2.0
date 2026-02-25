"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ImportJob {
  id: string;
  type: string;
  status: string;
  fileName: string | null;
  rowCount: number;
  errorSummary: string | null;
  createdAt: string;
}

export function ImportJobHistory() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/import/jobs")
      .then((r) => r.json())
      .then((data) => {
        setJobs(data.jobs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-text-muted">Loading…</p>;

  if (jobs.length === 0) {
    return <p className="text-sm text-text-muted">No import jobs yet.</p>;
  }

  return (
    <table className="w-full border bg-surface text-sm">
      <thead>
        <tr className="border-b">
          <th className="p-2 text-left">Date</th>
          <th className="p-2 text-left">Type</th>
          <th className="p-2 text-center">Status</th>
          <th className="p-2 text-center">Rows</th>
          <th className="p-2 text-left">Errors</th>
          <th className="p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.id} className="border-b">
            <td className="p-2">{new Date(job.createdAt).toLocaleDateString()}</td>
            <td className="p-2">{job.type}</td>
            <td className="p-2 text-center">
              <span
                className={
                  job.status === "COMPLETED" || job.status === "SUCCESS"
                    ? "text-green-700"
                    : job.status === "FAILED"
                    ? "text-red-700"
                    : "text-text-muted"
                }
              >
                {job.status}
              </span>
            </td>
            <td className="p-2 text-center">{job.rowCount}</td>
            <td className="p-2">{job.errorSummary || "–"}</td>
            <td className="p-2">
              <Link href={`/tenant/behaviour/import/job/${job.id}`} className="underline text-xs">
                View report
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
