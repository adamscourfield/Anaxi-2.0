import { describe, it, expect } from "vitest";
import { hasOnCallPermission, hasPermission, type AppPermission } from "@/lib/rbac";

const ALL_PERMISSIONS: AppPermission[] = [
  "oncall:create", "oncall:acknowledge", "oncall:resolve", "oncall:view_all", "oncall:cancel", "oncall:delete",
  "students:read", "students:write", "import:write",
  "meetings:create", "meetings:view_own", "meetings:view_all", "meetings:edit", "meetings:delete",
  "actions:create", "actions:manage", "actions:view_own",
  "observe:view", "observe:view_all", "observe:create", "observe:configure",
  "leave:request", "leave:approve", "leave:approve_all",
  "analysis:view", "analysis:view_behaviour", "analysis:export",
  "admin:access", "admin:users", "admin:settings",
];

describe("SUPPORT role", () => {
  it("has exactly the same permissions as TEACHER", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(hasPermission("SUPPORT", permission)).toBe(hasPermission("TEACHER", permission));
    }
  });
});

describe("SLT leave approval", () => {
  it("no longer has blanket leave:approve_all", () => {
    expect(hasPermission("SLT", "leave:approve_all")).toBe(false);
  });

  it("still has leave:approve (approval is granted per-person, not blocked)", () => {
    expect(hasPermission("SLT", "leave:approve")).toBe(true);
  });

  it("ADMIN and SUPER_ADMIN keep blanket leave:approve_all", () => {
    expect(hasPermission("ADMIN", "leave:approve_all")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "leave:approve_all")).toBe(true);
  });
});

describe("oncall:delete permission", () => {
  it("SLT, ADMIN, and SUPER_ADMIN can delete on-call requests", () => {
    expect(hasOnCallPermission("SLT", "oncall:delete")).toBe(true);
    expect(hasOnCallPermission("ADMIN", "oncall:delete")).toBe(true);
    expect(hasOnCallPermission("SUPER_ADMIN", "oncall:delete")).toBe(true);
  });

  it("other roles cannot delete on-call requests", () => {
    expect(hasOnCallPermission("TEACHER", "oncall:delete")).toBe(false);
    expect(hasOnCallPermission("SUPPORT", "oncall:delete")).toBe(false);
    expect(hasOnCallPermission("HOD", "oncall:delete")).toBe(false);
    expect(hasOnCallPermission("LEADER", "oncall:delete")).toBe(false);
    expect(hasOnCallPermission("HR", "oncall:delete")).toBe(false);
    expect(hasOnCallPermission("ON_CALL", "oncall:delete")).toBe(false);
  });
});
