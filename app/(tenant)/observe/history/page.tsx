import Link from "next/link";
import { getSessionUserOrThrow } from "@/lib/auth";
import { requireFeature } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ObservationHistoryPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const user = await getSessionUserOrThrow();
  await requireFeature(user.tenantId, "OBSERVATIONS");

  const teacherId = String(searchParams?.teacherId || "");
  const subject = String(searchParams?.subject || "").trim();
  const yearGroup = String(searchParams?.yearGroup || "").trim();
  const observerId = String(searchParams?.observerId || "");
  const from = String(searchParams?.from || "");
  const to = String(searchParams?.to || "");
  const windowDays = Number(searchParams?.window || "");
  const useWindow = Number.isFinite(windowDays) && windowDays > 0 && !from && !to;
  const windowStart = useWindow ? new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000) : null;

  const [teachers, observers, hodMemberships, coachAssignments] = await Promise.all([
    (prisma as any).user.findMany({ where: { tenantId: user.tenantId, isActive: true }, orderBy: { fullName: "asc" } }),
    (prisma as any).user.findMany({ where: { tenantId: user.tenantId, isActive: true, role: { in: ["LEADER", "SLT", "ADMIN"] } }, orderBy: { fullName: "asc" } }),
    (prisma as any).departmentMembership.findMany({ where: { userId: user.id, isHeadOfDepartment: true } }),
    (prisma as any).coachAssignment.findMany({ where: { coachUserId: user.id } }),
  ]);

  const hodDepartmentIds = (hodMemberships as any[]).map((m: any) => m.departmentId);
  const coacheeUserIds = (coachAssignments as any[]).map((a: any) => a.coacheeUserId);

  const hodDeptMemberships = hodDepartmentIds.length > 0
    ? await (prisma as any).departmentMembership.findMany({
        where: { tenantId: user.tenantId, departmentId: { in: hodDepartmentIds } },
        select: { userId: true, departmentId: true },
      })
    : [];

  const hodVisibleUserIds = new Set((hodDeptMemberships as any[]).map((m: any) => m.userId));
  const coachVisibleUserIds = new Set(coacheeUserIds);

  const where: any = {
    tenantId: user.tenantId,
    ...(subject ? { subject: { contains: subject, mode: "insensitive" } } : {}),
    ...(yearGroup ? { yearGroup } : {}),
    ...(observerId ? { observerId } : {}),
    ...((from || to || useWindow)
      ? {
          observedAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
            ...(useWindow && windowStart ? { gte: windowStart } : {}),
          }
        }
      : {})
  };

  let allowedTeacherIds: Set<string> | null = null;

  if (user.role === "TEACHER") {
    where.observedTeacherId = user.id;
    allowedTeacherIds = new Set([user.id]);
  } else if (user.role === "ADMIN" || user.role === "SLT") {
    if (teacherId) where.observedTeacherId = teacherId;
  } else {
    allowedTeacherIds = new Set<string>([
      ...Array.from(hodVisibleUserIds),
      ...Array.from(coachVisibleUserIds),
    ]);
    if (teacherId) {
      where.observedTeacherId = allowedTeacherIds.has(teacherId) ? teacherId : "__NO_MATCH__";
    } else {
      where.observedTeacherId = { in: Array.from(allowedTeacherIds) };
    }
  }

  const visibleTeachers = allowedTeacherIds
    ? (teachers as any[]).filter((t: any) => allowedTeacherIds!.has(t.id))
    : (teachers as any[]);

  const observations = await (prisma as any).observation.findMany({
    where,
    include: { observedTeacher: true, observer: true, signals: true },
    orderBy: { observedAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Observation history" subtitle="Filter by teacher, observer, subject, year group, and date range." />

      <Card>
        <form className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
          {user.role !== "TEACHER" ? (
            <>
              <select name="teacherId" defaultValue={teacherId} className="rounded-md border border-border bg-bg/60 p-2 text-sm text-text">
                <option value="">All teachers</option>
                {visibleTeachers.map((teacher: any) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
              </select>
              <select name="observerId" defaultValue={observerId} className="rounded-md border border-border bg-bg/60 p-2 text-sm text-text">
                <option value="">All observers</option>
                {(observers as any[]).map((observer) => <option key={observer.id} value={observer.id}>{observer.fullName}</option>)}
              </select>
            </>
          ) : null}
          <input name="subject" defaultValue={subject} placeholder="Subject" className="rounded-md border border-border bg-bg/60 p-2 text-sm text-text placeholder:text-muted" />
          <input name="yearGroup" defaultValue={yearGroup} placeholder="Year group" className="rounded-md border border-border bg-bg/60 p-2 text-sm text-text placeholder:text-muted" />
          <input name="from" type="date" defaultValue={from} className="rounded-md border border-border bg-bg/60 p-2 text-sm text-text" />
          <input name="to" type="date" defaultValue={to} className="rounded-md border border-border bg-bg/60 p-2 text-sm text-text" />
          <Button className="lg:col-span-1" type="submit">Apply filters</Button>
        </form>
      </Card>

      <Card className="p-0">
        {(observations as any[]).length === 0 ? (
          <div className="p-4">
            <EmptyState title="No observations found" description="Try widening your filters or selecting a different date range." />
          </div>
        ) : (
          <ul className="divide-y divide-border/70 p-3 text-sm">
            {(observations as any[]).map((observation) => (
              <li key={observation.id} className="px-1 py-2">
                <Link className="font-medium text-accent hover:text-accentHover" href={`/tenant/observe/${observation.id}`}>
                  {new Date(observation.observedAt).toLocaleDateString()} · {observation.subject} · {observation.yearGroup} · {observation.observedTeacher?.fullName} · by {observation.observer?.fullName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
