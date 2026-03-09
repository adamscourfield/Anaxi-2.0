import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminUser } from "@/lib/admin";

export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  const actor = await requireSuperAdminUser();
  const form = await req.formData();
  const enabledModules = new Set(form.getAll("modules").map((v) => String(v)));

  const existing = await prisma.tenantFeature.findMany({ where: { tenantId: params.tenantId } });

  const upserts = Array.from(enabledModules).map((key) =>
    prisma.tenantFeature.upsert({
      where: { tenantId_key: { tenantId: params.tenantId, key } },
      update: { enabled: true },
      create: { tenantId: params.tenantId, key, enabled: true },
    })
  );

  const disable = existing
    .filter((f) => !enabledModules.has(f.key))
    .map((f) => prisma.tenantFeature.update({ where: { id: f.id }, data: { enabled: false } }));

  await prisma.$transaction([...upserts, ...disable]);

  await (prisma as any).auditLog.create({
    data: {
      tenantId: params.tenantId,
      actorUserId: actor.id,
      action: "school.modules.update",
      targetType: "Tenant",
      targetId: params.tenantId,
      beforeJson: { enabled: existing.filter((f) => f.enabled).map((f) => f.key) },
      afterJson: { enabled: Array.from(enabledModules) },
    },
  });

  return NextResponse.redirect(new URL(`/god/schools/${params.tenantId}`, req.url));
}
