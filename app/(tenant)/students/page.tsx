import Link from "next/link";
import { getSessionUserOrThrow } from "@/lib/auth";
import { requireFeature } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getTenantVocab } from "@/lib/vocab";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetaText } from "@/components/ui/typography";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function StudentsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const user = await getSessionUserOrThrow();
  await requireFeature(user.tenantId, "STUDENTS");
  const vocab = await getTenantVocab(user.tenantId);

  const q = searchParams.q || "";
  const yearGroup = searchParams.yearGroup || "";
  const send = searchParams.send || "";
  const pp = searchParams.pp || "";
  const status = searchParams.status || "";

  const where: any = {
    tenantId: user.tenantId,
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { upn: { contains: q, mode: "insensitive" } }] } : {}),
    ...(yearGroup ? { yearGroup } : {}),
    ...(send ? { sendFlag: send === "true" } : {}),
    ...(pp ? { ppFlag: pp === "true" } : {}),
    ...(status ? { status } : {}),
  };

  const students = await (prisma as any).student.findMany({
    where,
    orderBy: { fullName: "asc" },
    take: 100,
    include: {
      snapshots: { orderBy: { snapshotDate: "desc" }, take: 1 },
      changeFlags: { where: { resolvedAt: null } },
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        subtitle="Monitor attendance, behaviour trends, and active flags across cohorts."
        actions={
          <>
            <Link href="/tenant/students/import" className="rounded-md border border-border/80 px-3 py-1.5 text-sm text-muted hover:bg-divider/60 hover:text-text">Import snapshots</Link>
            <Link href="/tenant/students/import-subject-teachers" className="rounded-md border border-border/80 px-3 py-1.5 text-sm text-muted hover:bg-divider/60 hover:text-text">Import subject teachers</Link>
          </>
        }
      />

      <Card>
        <form className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <input name="q" defaultValue={q} placeholder="Search name or UPN" className="rounded-md border border-border bg-bg/60 px-3 py-2 text-sm text-text placeholder:text-muted" />
          <input name="yearGroup" defaultValue={yearGroup} placeholder="Year" className="rounded-md border border-border bg-bg/60 px-3 py-2 text-sm text-text placeholder:text-muted" />
          <select name="send" defaultValue={send} className="rounded-md border border-border bg-bg/60 px-3 py-2 text-sm text-text"><option value="">SEND</option><option value="true">SEND Yes</option><option value="false">SEND No</option></select>
          <select name="pp" defaultValue={pp} className="rounded-md border border-border bg-bg/60 px-3 py-2 text-sm text-text"><option value="">PP</option><option value="true">PP Yes</option><option value="false">PP No</option></select>
          <select name="status" defaultValue={status} className="rounded-md border border-border bg-bg/60 px-3 py-2 text-sm text-text"><option value="">Status</option><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select>
          <Button type="submit">Apply filters</Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {(students as any[]).length === 0 ? (
          <div className="p-4">
            <EmptyState title="No students found" description="Try broadening your filters or import a recent snapshot." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg/60 text-xs uppercase tracking-[0.05em] text-muted">
                <tr className="border-b border-border">
                  <th className="p-3 text-left">UPN</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-center">Year</th>
                  <th className="p-3 text-center">Attendance</th>
                  <th className="p-3 text-center">{vocab.detentions.plural}</th>
                  <th className="p-3 text-center">Active flags</th>
                </tr>
              </thead>
              <tbody>
                {(students as any[]).map((s: any) => {
                  const latest = s.snapshots?.[0];
                  return (
                    <tr key={s.id} className="border-b border-border/70 last:border-0 hover:bg-bg/35">
                      <td className="p-3 text-muted">{s.upn}</td>
                      <td className="p-3"><Link className="font-medium text-accent hover:text-accentHover" href={`/tenant/students/${s.id}`}>{s.fullName}</Link></td>
                      <td className="p-3 text-center">{s.yearGroup || "-"}</td>
                      <td className="p-3 text-center">{latest ? String(latest.attendancePct) : "-"}</td>
                      <td className="p-3 text-center">{latest ? latest.detentionsCount : "-"}</td>
                      <td className="p-3 text-center">{s.changeFlags?.length || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <MetaText>Showing up to 100 students. Refine filters to narrow this list.</MetaText>
    </div>
  );
}
