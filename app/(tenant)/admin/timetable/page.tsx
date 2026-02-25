import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin";
import { H1, BodyText, MetaText } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { TimetableImportMapper } from "@/components/timetable/TimetableImportMapper";

export default async function AdminTimetablePage() {
  const user = await requireAdminUser();

  const lastJob = await (prisma as any).timetableImportJob.findFirst({
    where: { tenantId: user.tenantId, status: "COMPLETED" },
    orderBy: { finishedAt: "desc" },
  });

  const entryCount = await (prisma as any).timetableEntry.count({
    where: { tenantId: user.tenantId },
  });

  const unknownTeacherCount = await (prisma as any).timetableEntry.count({
    where: {
      tenantId: user.tenantId,
      teacherUserId: null,
      teacherEmailRaw: { not: null },
    },
  });

  const recentEntries = await (prisma as any).timetableEntry.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      classCode: true,
      subject: true,
      yearGroup: true,
      teacherEmailRaw: true,
      room: true,
      dayOfWeek: true,
      period: true,
      weekPattern: true,
      startTime: true,
      endTime: true,
      teacherUserId: true,
    },
  });

  return (
    <div className="space-y-6">
      <H1>Timetable</H1>

      {/* Summary tiles */}
      <div className="flex flex-wrap gap-4">
        <Card className="min-w-[140px]">
          <div className="text-3xl font-bold text-text">{entryCount}</div>
          <MetaText className="mt-1">Total entries</MetaText>
        </Card>
        <Card className="min-w-[140px]">
          <div className="text-3xl font-bold text-amber-600">{unknownTeacherCount}</div>
          <MetaText className="mt-1">Unknown teacher emails</MetaText>
        </Card>
        <Card className="min-w-[200px]">
          {lastJob ? (
            <>
              <div className="text-sm font-medium text-text">
                Last updated:{" "}
                {new Date(lastJob.finishedAt ?? lastJob.createdAt).toLocaleString()}
              </div>
              <MetaText className="mt-1">
                {lastJob.rowsProcessed} imported, {lastJob.rowsFailed} failed
              </MetaText>
              <div className="mt-2 flex gap-2">
                {lastJob.errorReportJson && (
                  <a
                    href={`/api/admin/timetable/import/jobs/${lastJob.id}/errors.csv`}
                    download
                    className="text-xs text-text underline"
                  >
                    Download error report
                  </a>
                )}
                {lastJob.conflictsJson && (
                  <a
                    href={`/api/admin/timetable/import/jobs/${lastJob.id}/conflicts.csv`}
                    download
                    className="text-xs text-amber-700 underline"
                  >
                    Download conflict report
                  </a>
                )}
              </div>
            </>
          ) : (
            <BodyText className="text-muted">No imports yet</BodyText>
          )}
        </Card>
      </div>

      {/* Import UI */}
      <TimetableImportMapper />

      {/* Entries table */}
      {recentEntries.length > 0 && (
        <Card>
          <H1 className="mb-3 text-[18px]">Timetable entries (latest {recentEntries.length})</H1>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1 text-left font-medium text-text">ClassCode</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Subject</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Year</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Teacher email</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Day</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Period</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Room</th>
                </tr>
              </thead>
              <tbody>
                {(recentEntries as any[]).map((entry: any) => (
                  <tr key={entry.id} className="border-b border-border last:border-0">
                    <td className="px-2 py-1 text-text">{entry.classCode}</td>
                    <td className="px-2 py-1 text-text">{entry.subject}</td>
                    <td className="px-2 py-1 text-text">{entry.yearGroup}</td>
                    <td className="px-2 py-1 text-text">
                      {entry.teacherEmailRaw ?? "—"}
                      {!entry.teacherUserId && entry.teacherEmailRaw && (
                        <span className="ml-1 text-xs text-amber-600">(unmatched)</span>
                      )}
                    </td>
                    <td className="px-2 py-1 text-text">{entry.dayOfWeek ?? "—"}</td>
                    <td className="px-2 py-1 text-text">{entry.period ?? "—"}</td>
                    <td className="px-2 py-1 text-text">{entry.room ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
