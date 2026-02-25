import Link from "next/link";
import { getSessionUserOrThrow } from "@/lib/auth";
import { requireFeature } from "@/lib/guards";
import { hasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { ImportJobHistory } from "@/components/import/ImportJobHistory";
import { generateCSVTemplate } from "@/modules/import/csv-templates";

export default async function BehaviourImportPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const user = await getSessionUserOrThrow();
  await requireFeature(user.tenantId, "STUDENTS_IMPORT");
  if (!hasPermission(user.role, "import:write")) redirect("/tenant");

  const tab = searchParams.tab ?? "upload";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Import Student Data</h1>
        <Link
          href="/api/import/csv/template"
          className="rounded border px-3 py-1 text-sm bg-surface"
        >
          Download CSV Template
        </Link>
      </div>

      <div className="flex gap-4 border-b">
        <Link
          href="?tab=upload"
          className={`pb-2 text-sm ${tab === "upload" ? "border-b-2 border-text font-medium" : "text-text-muted"}`}
        >
          Upload
        </Link>
        <Link
          href="?tab=history"
          className={`pb-2 text-sm ${tab === "history" ? "border-b-2 border-text font-medium" : "text-text-muted"}`}
        >
          History
        </Link>
      </div>

      {tab === "upload" && (
        <div className="rounded border bg-surface p-4 space-y-4">
          <div>
            <h2 className="font-medium mb-1">CSV Format</h2>
            <p className="text-sm text-text-muted">
              Upload a CSV file with student snapshot data. Required columns:
              UPN, Name, YearGroup, Attendance.
            </p>
          </div>

          <div className="rounded border bg-bg p-3 font-mono text-xs overflow-auto">
            {generateCSVTemplate()}
          </div>

          <form
            action="/api/students/import"
            method="post"
            encType="multipart/form-data"
            className="space-y-3"
          >
            <div>
              <label className="block text-sm mb-1">Snapshot Date</label>
              <input
                type="date"
                name="snapshotDate"
                required
                className="border px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">CSV File</label>
              <input
                type="file"
                name="file"
                accept=".csv"
                required
                className="text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded bg-text px-4 py-2 text-sm text-bg"
            >
              Upload and Import
            </button>
          </form>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          <h2 className="font-medium">Import History</h2>
          <ImportJobHistory />
        </div>
      )}
    </div>
  );
}
