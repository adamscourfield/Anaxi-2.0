import { describe, expect, it } from "vitest";
import { validateLeavePolicy } from "@/lib/leavePolicy";

describe("validateLeavePolicy", () => {
  const base = {
    startDate: new Date(2026, 5, 10),
    endDate: new Date(2026, 5, 12),
    medicalEvidenceUrl: null as string | null,
    existingRequests: [] as Array<{ id: string; startDate: Date; endDate: Date; status: string }>,
  };

  it("allows leave starting the same day, with no minimum notice period", () => {
    expect(
      validateLeavePolicy({
        ...base,
        startDate: new Date(2026, 5, 1),
        endDate: new Date(2026, 5, 1),
        medicalEvidenceUrl: "/file",
      }),
    ).toBeNull();
  });

  it("requires medical evidence for 3+ business days", () => {
    expect(validateLeavePolicy({ ...base, medicalEvidenceUrl: null })).toBe("MEDICAL_REQUIRED");
    expect(
      validateLeavePolicy({ ...base, medicalEvidenceUrl: "/api/leave/evidence/x.pdf" }),
    ).toBeNull();
  });

  it("detects overlapping pending leave", () => {
    expect(
      validateLeavePolicy({
        ...base,
        medicalEvidenceUrl: "/file",
        existingRequests: [
          {
            id: "other",
            startDate: new Date(2026, 5, 11),
            endDate: new Date(2026, 5, 13),
            status: "PENDING",
          },
        ],
      }),
    ).toBe("OVERLAPPING_LEAVE");
  });
});
