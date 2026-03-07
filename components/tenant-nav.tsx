"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FeatureKey, UserRole } from "@/lib/types";
import { hasAnyPermission, hasPermission } from "@/lib/rbac";

type NavItem = {
  label: string;
  href: string;
  badgeCount?: number;
  icon: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

function iconFor(href: string) {
  if (href === "/home") return "◻";
  if (href === "/my-actions") return "✓";
  if (href.includes("/observe/history")) return "◷";
  if (href.includes("/observe")) return "◎";
  if (href.includes("/explorer")) return "◌";
  if (href.includes("/students")) return "◍";
  if (href.includes("/behaviour/import")) return "⇢";
  if (href.includes("/on-call")) return "⚑";
  if (href.includes("/meetings")) return "◫";
  if (href.includes("/leave")) return "◐";
  if (href.includes("/analysis/teachers")) return "△";
  if (href.includes("/analysis/cpd")) return "◇";
  if (href.includes("/analysis/students")) return "▽";
  if (href.includes("/admin/users")) return "◔";
  if (href.includes("/admin/departments")) return "▦";
  if (href.includes("/admin/features")) return "◩";
  if (href.includes("/admin")) return "□";
  return "•";
}

export function TenantNav({
  role,
  enabledFeatures,
  onCallCount = 0,
  leaveCount = 0,
}: {
  role: UserRole;
  enabledFeatures: FeatureKey[];
  onCallCount?: number;
  leaveCount?: number;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const has = (feature: FeatureKey) => enabledFeatures.includes(feature);
  const canImport = hasPermission(role, "import:write");
  const canAccessAdmin = hasPermission(role, "admin:access");
  const canAccessAdminUsers = hasPermission(role, "admin:users");
  const canAccessAdminSettings = hasPermission(role, "admin:settings");
  const canSeeAnalysis = hasAnyPermission(role, ["analysis:view", "analysis:export"]);

  const navItem = (label: string, href: string, badgeCount?: number): NavItem => ({
    label,
    href,
    badgeCount,
    icon: iconFor(href),
  });

  const sections: NavSection[] = [
    {
      label: "Overview",
      items: [navItem("Home", "/home"), navItem("My actions", "/my-actions")],
    },
    {
      label: "Instruction (Observe)",
      items: [
        ...(has("OBSERVATIONS") ? [navItem("Observation feed", "/tenant/observe")] : []),
        ...(has("OBSERVATIONS") ? [navItem("Signals history", "/tenant/observe/history")] : []),
        ...(has("ANALYSIS") && canSeeAnalysis ? [navItem("Explorer", "/explorer")] : []),
      ],
    },
    {
      label: "Culture (Behaviour)",
      items: [
        ...(has("STUDENTS") ? [navItem("Students", "/tenant/students")] : []),
        ...(has("STUDENTS_IMPORT") && canImport ? [navItem("Behaviour import", "/tenant/behaviour/import")] : []),
        ...(has("ON_CALL") ? [navItem("On call", "/tenant/on-call", onCallCount)] : []),
      ],
    },
    {
      label: "Operations",
      items: [
        ...(has("MEETINGS") ? [navItem("Meetings", "/tenant/meetings")] : []),
        ...(has("LEAVE") ? [navItem("Leave of absence", "/tenant/leave", leaveCount)] : []),
      ],
    },
    {
      label: "Analytics",
      items: [
        ...(has("ANALYSIS") && canSeeAnalysis ? [navItem("Teacher analysis", "/analysis/teachers")] : []),
        ...(has("ANALYSIS") && canSeeAnalysis ? [navItem("CPD priorities", "/analysis/cpd")] : []),
        ...(has("ANALYSIS") && canSeeAnalysis ? [navItem("Student priorities", "/analysis/students")] : []),
      ],
    },
    {
      label: "Administration",
      items: [
        ...(canAccessAdmin && has("ADMIN") ? [navItem("Admin dashboard", "/tenant/admin")] : []),
        ...(canAccessAdminUsers && has("ADMIN") ? [navItem("User management", "/tenant/admin/users")] : []),
        ...(canAccessAdminSettings && has("ADMIN") ? [navItem("Departments", "/tenant/admin/departments")] : []),
        ...(canAccessAdminSettings && has("ADMIN") ? [navItem("Feature flags", "/tenant/admin/features")] : []),
      ],
    },
  ].filter((section) => section.items.length > 0);

  return (
    <aside
      className={`sticky top-4 h-fit rounded-2xl border border-border/80 bg-surface/95 p-3 shadow-sm backdrop-blur-sm calm-transition ${
        collapsed ? "w-[220px]" : "w-full md:w-[292px]"
      }`}
      aria-label="Sidebar menu"
    >
      <button
        onClick={() => setCollapsed((previous) => !previous)}
        className="mb-3 w-full rounded-lg border border-border/80 bg-bg/20 px-3 py-2 text-left text-xs font-medium text-muted hover:bg-divider/70"
        type="button"
        aria-expanded={!collapsed}
      >
        {collapsed ? "Expand menu" : "Collapse menu"}
      </button>

      <nav className="space-y-2 text-sm">
        {sections.map((section) => {
          const sectionHasCurrent = section.items.some((item) => pathname?.startsWith(item.href));

          return (
            <details key={section.label} open={sectionHasCurrent || !collapsed} className="overflow-hidden rounded-xl border border-border/70 bg-bg/20">
              <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                {section.label}
              </summary>
              <ul className="space-y-1.5 border-t border-border/60 px-2 py-2">
                {section.items.map((item) => {
                  const active = pathname?.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm calm-transition ${
                          active
                            ? "border border-border bg-divider/80 text-text"
                            : "border border-transparent text-muted hover:border-border/60 hover:bg-divider/60 hover:text-text"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-semibold ${
                              active ? "border-border bg-surface text-text" : "border-border/80 bg-bg text-muted group-hover:text-text"
                            }`}
                            aria-hidden
                          >
                            {item.icon}
                          </span>
                          <span className="font-medium tracking-[0.01em]">{item.label}</span>
                        </span>
                        {item.badgeCount && item.badgeCount > 0 ? (
                          <span className="rounded-full bg-warning px-1.5 py-0.5 text-[11px] font-semibold text-bg">{item.badgeCount}</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </nav>
    </aside>
  );
}
