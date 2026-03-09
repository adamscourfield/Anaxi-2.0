import { notFound } from "next/navigation";
import { requireSuperAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const MODULES = [
  "OBSERVATIONS",
  "SIGNALS",
  "STUDENTS",
  "STUDENTS_IMPORT",
  "BEHAVIOUR_IMPORT",
  "LEAVE",
  "LEAVE_OF_ABSENCE",
  "ON_CALL",
  "MEETINGS",
  "TIMETABLE",
  "ADMIN",
  "ADMIN_SETTINGS",
  "ANALYSIS",
  "STUDENT_ANALYSIS",
] as const;

export default async function SchoolDetailPage({ params, searchParams }: { params: { tenantId: string }, searchParams?: { invite?: string } }) {
  await requireSuperAdminUser();

  const school = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    include: {
      features: true,
      users: {
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, email: true, role: true, isActive: true },
      },
      adminInvites: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!school) notFound();

  const enabled = new Set(school.features.filter((f) => f.enabled).map((f) => f.key));

  return (
    <div className="max-w-3xl space-y-5">
      {searchParams?.invite ? (
        <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm">
          <div className="font-medium text-emerald-800">Invite created.</div>
          <div className="text-emerald-800/90">Copy this one-time link and send it securely to the admin.</div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs underline">Show invite link</summary>
            <div className="mt-1 break-all text-xs">{decodeURIComponent(searchParams.invite)}</div>
          </details>
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-semibold">{school.name}</h1>
        <p className="text-sm text-muted">{school.id} · {school.slug ?? "no-slug"} · {school.status}</p>
      </div>

      <form method="post" action={`/api/god/schools/${school.id}/status`} className="flex items-end gap-2 rounded-lg border border-border bg-surface p-4">
        <label className="text-sm">
          Status
          <select name="status" defaultValue={school.status} className="ml-2 rounded border border-border bg-bg px-2 py-1">
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>
        <button className="rounded bg-primaryBtn px-3 py-1.5 text-sm text-white">Update</button>
      </form>

      <form method="post" action={`/api/god/schools/${school.id}/modules`} className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-medium">Modules</h2>
        <div className="grid gap-1 sm:grid-cols-2">
          {MODULES.map((m) => (
            <label key={m} className="text-sm">
              <input type="checkbox" name="modules" value={m} defaultChecked={enabled.has(m)} className="mr-2" />
              {m}
            </label>
          ))}
        </div>
        <button className="rounded bg-primaryBtn px-3 py-1.5 text-sm text-white">Save modules</button>
      </form>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 font-medium">Admins</h2>
        <ul className="space-y-1 text-sm">
          {school.users.map((u) => (
            <li key={u.id}>{u.fullName} · {u.email} · {u.role} · {u.isActive ? "active" : "inactive"}</li>
          ))}
        </ul>
      </div>

      <form method="post" action={`/api/god/schools/${school.id}/invites`} className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-medium">Invite school admin</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required name="fullName" placeholder="Full name" className="rounded border border-border bg-bg px-3 py-2 text-sm" />
          <input required type="email" name="email" placeholder="Email" className="rounded border border-border bg-bg px-3 py-2 text-sm" />
        </div>
        <button className="rounded bg-primaryBtn px-3 py-1.5 text-sm text-white">Create invite link</button>
      </form>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 font-medium">Recent invites</h2>
        <ul className="space-y-2 text-sm">
          {school.adminInvites.map((i) => {
            const isAccepted = Boolean(i.acceptedAt);
            const isExpired = !isAccepted && new Date(i.expiresAt).getTime() < Date.now();
            return (
              <li key={i.id} className="rounded border border-border p-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div>{i.fullName} · {i.email}</div>
                    <div className="text-xs text-muted">
                      {isAccepted
                        ? `accepted ${new Date(i.acceptedAt!).toLocaleDateString("en-GB")}`
                        : isExpired
                          ? "expired"
                          : `expires ${new Date(i.expiresAt).toLocaleDateString("en-GB")}`}
                    </div>
                  </div>
                  {!isAccepted ? (
                    <div className="flex gap-1">
                      <form method="post" action={`/api/god/schools/${school.id}/invites/${i.id}/resend`}>
                        <button className="rounded border border-border px-2 py-1 text-xs hover:bg-divider">Resend</button>
                      </form>
                      {!isExpired ? (
                        <form method="post" action={`/api/god/schools/${school.id}/invites/${i.id}/revoke`}>
                          <button className="rounded border border-border px-2 py-1 text-xs hover:bg-divider">Revoke</button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
          {school.adminInvites.length === 0 ? <li className="text-muted">No invites yet.</li> : null}
        </ul>
      </div>
    </div>
  );
}
