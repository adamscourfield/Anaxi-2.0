import Link from "next/link";
import { requireSuperAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function GodDashboardPage() {
  await requireSuperAdminUser();

  const [schools, admins] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      include: {
        features: { where: { enabled: true }, select: { key: true } },
        users: { where: { role: "ADMIN" }, select: { id: true } },
      },
    }),
    prisma.user.count({ where: { role: "SUPER_ADMIN", isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">God Mode</h1>
          <p className="text-sm text-muted">Platform-level school provisioning and module control.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/god/audit" className="rounded border border-border bg-surface px-4 py-2 text-sm hover:bg-divider">Audit log</Link>
          <Link href="/god/schools/new" className="rounded bg-primaryBtn px-4 py-2 text-sm text-white hover:bg-primaryBtnHover">
            + Create school
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs text-muted">Schools</div>
          <div className="text-2xl font-semibold">{schools.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs text-muted">Super admins</div>
          <div className="text-2xl font-semibold">{admins}</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs text-muted">Active schools</div>
          <div className="text-2xl font-semibold">{schools.filter((s) => s.status === "ACTIVE").length}</div>
        </div>
      </div>

      <div className="space-y-3">
        {schools.map((school) => (
          <Link key={school.id} href={`/god/schools/${school.id}`} className="block rounded-lg border border-border bg-surface p-4 hover:bg-divider">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{school.name}</div>
                <div className="text-xs text-muted">{school.slug ?? "no-slug"} · {school.status}</div>
              </div>
              <div className="text-right text-xs text-muted">
                <div>{school.users.length} admin(s)</div>
                <div>{school.features.length} module(s) enabled</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
