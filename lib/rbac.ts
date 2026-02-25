import { UserRole } from "@/lib/types";

export const isAdmin = (role: UserRole) => role === "ADMIN";
export const canLead = (role: UserRole) => role === "LEADER" || role === "SLT" || role === "ADMIN";

export type OnCallPermission =
  | "oncall:create"
  | "oncall:acknowledge"
  | "oncall:resolve"
  | "oncall:view_all"
  | "oncall:cancel";

export type StudentPermission =
  | "students:read"
  | "students:write"
  | "import:write";

export type AppPermission = OnCallPermission | StudentPermission;

const ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  ADMIN: ["oncall:create", "oncall:acknowledge", "oncall:resolve", "oncall:view_all", "oncall:cancel", "import:write", "students:read", "students:write"],
  SLT: ["oncall:create", "oncall:acknowledge", "oncall:resolve", "oncall:view_all", "import:write", "students:read", "students:write"],
  LEADER: ["oncall:create", "oncall:cancel", "students:read"],
  TEACHER: ["oncall:create", "oncall:cancel", "students:read"],
  HR: ["oncall:create", "import:write", "students:read"],
  ON_CALL: ["oncall:acknowledge", "oncall:resolve", "oncall:view_all"],
};

export function hasOnCallPermission(role: UserRole, permission: OnCallPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasPermission(role: UserRole, permission: AppPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
