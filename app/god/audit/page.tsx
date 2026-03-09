import Link from "next/link";
import { requireSuperAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 30;

export default async function GodAuditPage({
  searchParams,
}: {
  searchParams?: { action?: string; tenantId?: string; page?: string };
}) {
  await requireSuperAdminUser();

  const action = searchParams?.action?.trim() || "";
  const tenantId = searchParams?.tenantId?.trim() || "";
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);

  const where: any = {
    ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
    ...(tenantId ? { tenantId } : {}),
  };

  const [rows, total, tenants] = await Promise.all([
    (prisma as any).auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        tenant: { select: { id: true, name: true } },
        actor: { select: { fullName: true, email: true } },
      },
    }),
    (prisma as any).auditLog.count({ where }),
    prisma.tenant.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">God audit log</h1>

      <form className="grid gap-2 rounded-lg border border-border bg-surface p-3 sm:grid-cols-4" method="get">
        <input
          name="action"
          defaultValue={action}
          placeholder="Filter action"
          className="rounded border border-border bg-bg px-2 py-1 text-sm"
        />
        <select name="tenantId" defaultValue={tenantId} className="rounded border border-border bg-bg px-2 py-1 text-sm">
          <option value="">All schools</option>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input type="hidden" name="page" value="1" />
        <button className="rounded bg-primaryBtn px-3 py-1 text-sm text-white">Apply</button>
      </form>

      <div className="overflow-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-bg text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">School</th>
              <th className="px-3 py-2">Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString("en-GB")}</td>
                <td className="px-3 py-2">{r.actor?.fullName ?? r.actor?.email ?? "—"}</td>
                <td className="px-3 py-2">{r.action}</td>
                <td className="px-3 py-2">{r.tenant?.name ?? "platform"}</td>
                <td className="px-3 py-2">{r.targetType}{r.targetId ? `:${r.targetId}` : ""}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted">No audit rows.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <Link
            href={`/god/audit?action=${encodeURIComponent(action)}&tenantId=${encodeURIComponent(tenantId)}&page=${Math.max(1, page - 1)}`}
            className={`rounded border border-border px-2 py-1 ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-divider"}`}
          >Prev</Link>
          <Link
            href={`/god/audit?action=${encodeURIComponent(action)}&tenantId=${encodeURIComponent(tenantId)}&page=${Math.min(totalPages, page + 1)}`}
            className={`rounded border border-border px-2 py-1 ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-divider"}`}
          >Next</Link>
        </div>
      </div>
    </div>
  );
}
