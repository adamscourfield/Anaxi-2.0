import { requireSuperAdminUser } from "@/lib/admin";

const DEFAULT_MODULES = [
  "OBSERVATIONS",
  "SIGNALS",
  "STUDENTS",
  "STUDENTS_IMPORT",
  "ON_CALL",
  "MEETINGS",
  "ADMIN",
  "ADMIN_SETTINGS",
  "ANALYSIS",
];

export default async function NewSchoolPage() {
  await requireSuperAdminUser();

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Create school</h1>
      <p className="text-sm text-muted">Creates a new tenant, enables selected modules, and creates initial school admin.</p>

      <form method="post" action="/api/god/schools" className="space-y-4 rounded-lg border border-border bg-surface p-4">
        <label className="block space-y-1 text-sm">
          <span>School name</span>
          <input required name="name" className="w-full rounded border border-border bg-bg px-3 py-2" placeholder="Riverdale Academy" />
        </label>

        <label className="block space-y-1 text-sm">
          <span>School slug</span>
          <input name="slug" className="w-full rounded border border-border bg-bg px-3 py-2" placeholder="riverdale-academy" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>Admin full name</span>
            <input required name="adminName" className="w-full rounded border border-border bg-bg px-3 py-2" placeholder="Alex Morgan" />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Admin email</span>
            <input required type="email" name="adminEmail" className="w-full rounded border border-border bg-bg px-3 py-2" placeholder="admin@riverdale.sch.uk" />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span>Temporary admin password</span>
          <input name="temporaryPassword" defaultValue="ChangeMe123!" className="w-full rounded border border-border bg-bg px-3 py-2" />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Enable modules</legend>
          <div className="grid gap-1 sm:grid-cols-2">
            {DEFAULT_MODULES.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="modules" value={m} defaultChecked /> {m}
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="rounded bg-primaryBtn px-4 py-2 text-sm text-white hover:bg-primaryBtnHover">Create school</button>
      </form>
    </div>
  );
}
