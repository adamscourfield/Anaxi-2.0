import { getSessionUserOrThrow } from "@/lib/auth";
import { requireFeature } from "@/lib/guards";
import { canManageLoa } from "@/lib/loa";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function LeaveCalendarPage() {
  const user = await getSessionUserOrThrow();
  await requireFeature(user.tenantId, "LEAVE");
  const manager = await canManageLoa(user);

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const requests = await (prisma as any).lOARequest.findMany({
    where: {
      tenantId: user.tenantId,
      ...(manager ? {} : { requesterId: user.id }),
      status: { in: ["PENDING", "APPROVED"] },
      startDate: { lt: end },
      endDate: { gte: start }
    },
    include: { requester: true },
    orderBy: { startDate: "asc" }
  });

  const days = Array.from({ length: 31 }, (_, i) => {
    const date = new Date(start);
    date.setDate(i + 1);
    return date;
  }).filter((d) => d.getMonth() === start.getMonth());

  // Calculate leading empty cells for the calendar grid (Monday = 0)
  const firstDayOfWeek = (start.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-5">
      <PageHeader title={`Leave calendar — ${start.toLocaleString("default", { month: "long", year: "numeric" })}`} subtitle="Calendar view of pending and approved leave requests." />
      <Card className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-2 text-center text-xs font-semibold text-muted">
              {label}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Leading blanks */}
          {leadingBlanks.map((i) => (
            <div key={`blank-${i}`} className="min-h-[80px] rounded-lg bg-bg/30" />
          ))}
          {/* Day cells */}
          {days.map((day) => {
            const entries = (requests as any[]).filter(
              (request) => day >= new Date(request.startDate) && day <= new Date(request.endDate)
            );
            const isToday = dayKey(day) === dayKey(today);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={dayKey(day)}
                className={`min-h-[80px] rounded-lg border p-1.5 text-xs ${
                  isToday
                    ? "border-accent bg-[var(--accent-tint)]"
                    : isWeekend
                    ? "border-border/40 bg-bg/40"
                    : "border-border/60 bg-white"
                }`}
              >
                <p className={`mb-1 text-[11px] font-semibold ${isToday ? "text-accent" : "text-text"}`}>
                  {day.getDate()}
                </p>
                {entries.length > 0 && (
                  <div className="space-y-0.5">
                    {entries.slice(0, 3).map((request: any) => (
                      <div
                        key={request.id}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                          request.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                        title={`${request.requester?.fullName} · ${request.status}`}
                      >
                        {request.requester?.fullName ?? "—"}
                      </div>
                    ))}
                    {entries.length > 3 && (
                      <p className="text-[10px] text-muted">+{entries.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
