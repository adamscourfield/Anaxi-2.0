import { NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

/** GET /api/admin/timetable/import/mappings?headerSignature=... */
export async function GET(req: Request) {
  const user = await getSessionUserOrThrow();
  requireRole(user, ["ADMIN"]);

  const { searchParams } = new URL(req.url);
  const headerSignature = searchParams.get("headerSignature") ?? undefined;

  const where: Record<string, unknown> = { tenantId: user.tenantId, type: "TIMETABLE" };
  if (headerSignature) where.headerSignature = headerSignature;

  const mappings = await (prisma as any).tenantImportMapping.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ mappings });
}
