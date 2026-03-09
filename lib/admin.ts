import { getSessionUserOrThrow } from "@/lib/auth";
import { requireRole } from "@/lib/guards";

export async function requireAdminUser() {
  const user = await getSessionUserOrThrow();
  requireRole(user, ["ADMIN", "SUPER_ADMIN"]);
  return user;
}

export async function requireSuperAdminUser() {
  const user = await getSessionUserOrThrow();
  requireRole(user, ["SUPER_ADMIN"]);
  return user;
}
