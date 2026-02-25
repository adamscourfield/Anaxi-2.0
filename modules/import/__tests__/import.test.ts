import { describe, expect, it } from "vitest";
import { parseStudentsCsv, parseAttendancePct, parseBoolean, parseStatus } from "@/modules/students/csv";
import { generateCSVTemplate, validateAgainstTemplate, STRICT_TEMPLATE_COLUMNS } from "@/modules/import/csv-templates";

describe("parseAttendancePct", () => {
  it("handles decimal percentage", () => {
    expect(parseAttendancePct("96.5")).toBe(96.5);
    expect(parseAttendancePct("100")).toBe(100);
    expect(parseAttendancePct("0")).toBe(0);
  });

  it("strips % sign", () => {
    expect(parseAttendancePct("96.5%")).toBe(96.5);
  });

  it("converts fractional to percentage", () => {
    expect(parseAttendancePct("0.965")).toBe(96.5);
    expect(parseAttendancePct("1")).toBe(100);
  });

  it("returns 0 for empty/invalid", () => {
    expect(parseAttendancePct("")).toBe(0);
    expect(parseAttendancePct("abc")).toBe(0);
  });
});

describe("parseBoolean", () => {
  it("parses truthy values", () => {
    expect(parseBoolean("Yes")).toBe(true);
    expect(parseBoolean("yes")).toBe(true);
    expect(parseBoolean("1")).toBe(true);
    expect(parseBoolean("true")).toBe(true);
    expect(parseBoolean("y")).toBe(true);
  });

  it("parses falsy values", () => {
    expect(parseBoolean("No")).toBe(false);
    expect(parseBoolean("0")).toBe(false);
    expect(parseBoolean("")).toBe(false);
  });
});

describe("parseStatus", () => {
  it("returns ARCHIVED for archive values", () => {
    expect(parseStatus("archived")).toBe("ARCHIVED");
    expect(parseStatus("Archived")).toBe("ARCHIVED");
    expect(parseStatus("inactive")).toBe("ARCHIVED");
  });

  it("returns ACTIVE for other values", () => {
    expect(parseStatus("Active")).toBe("ACTIVE");
    expect(parseStatus("")).toBe("ACTIVE");
    expect(parseStatus("active")).toBe("ACTIVE");
  });
});

describe("parseStudentsCsv", () => {
  const mapping = {
    UPN: "UPN", Name: "Name", YearGroup: "YearGroup",
    PositivePointsTotal: "PositivePointsTotal", Detentions: "Detentions",
    InternalExclusions: "InternalExclusions", Suspensions: "Suspensions",
    Attendance: "Attendance", Lateness: "Lateness", OnCalls: "OnCalls",
    SEND: "SEND", PP: "PP", Status: "Status"
  };

  it("parses a valid row", () => {
    const csv = [
      "UPN,Name,YearGroup,PositivePointsTotal,Detentions,InternalExclusions,Suspensions,Attendance,Lateness,OnCalls,SEND,PP,Status",
      "U1,Ada Lovelace,Y10,10,2,0,0,96.5,1,2,Yes,No,Active"
    ].join("\n");

    const { parsed, errors } = parseStudentsCsv(csv, mapping);
    expect(errors).toHaveLength(0);
    expect(parsed[0].upn).toBe("U1");
    expect(parsed[0].fullName).toBe("Ada Lovelace");
    expect(parsed[0].sendFlag).toBe(true);
    expect(parsed[0].ppFlag).toBe(false);
    expect(parsed[0].attendancePct).toBe(96.5);
    expect(parsed[0].detentionsCount).toBe(2);
  });

  it("errors when UPN is missing", () => {
    const csv = [
      "UPN,Name,YearGroup,PositivePointsTotal,Detentions,InternalExclusions,Suspensions,Attendance,Lateness,OnCalls,SEND,PP,Status",
      ",Ada Lovelace,Y10,10,2,0,0,96.5,1,2,Yes,No,Active"
    ].join("\n");

    const { errors } = parseStudentsCsv(csv, mapping);
    expect(errors.some(e => e.field === "UPN")).toBe(true);
  });

  it("handles column mapping (custom column names)", () => {
    const customMapping = {
      UPN: "StudentID", Name: "FullName", YearGroup: "Year",
      PositivePointsTotal: "Positives", Detentions: "Detentions",
      InternalExclusions: "InternalExclusions", Suspensions: "Suspensions",
      Attendance: "Attendance", Lateness: "Lateness", OnCalls: "OnCalls",
      SEND: "SEND", PP: "PP", Status: "Status"
    };
    const csv = [
      "StudentID,FullName,Year,Positives,Detentions,InternalExclusions,Suspensions,Attendance,Lateness,OnCalls,SEND,PP,Status",
      "U2,Bob Smith,Y11,5,0,0,0,90.0,0,0,No,No,Active"
    ].join("\n");

    const { parsed, errors } = parseStudentsCsv(csv, customMapping);
    expect(errors).toHaveLength(0);
    expect(parsed[0].upn).toBe("U2");
    expect(parsed[0].fullName).toBe("Bob Smith");
  });

  it("processes multiple rows", () => {
    const csv = [
      "UPN,Name,YearGroup,PositivePointsTotal,Detentions,InternalExclusions,Suspensions,Attendance,Lateness,OnCalls,SEND,PP,Status",
      "U1,Alice,Y10,10,1,0,0,95,0,0,No,No,Active",
      "U2,Bob,Y11,5,2,1,0,88,3,1,Yes,Yes,Active"
    ].join("\n");

    const { parsed } = parseStudentsCsv(csv, mapping);
    expect(parsed).toHaveLength(2);
    expect(parsed[1].upn).toBe("U2");
    expect(parsed[1].sendFlag).toBe(true);
  });
});

describe("CSV templates", () => {
  it("generateCSVTemplate returns valid CSV string", () => {
    const template = generateCSVTemplate();
    const lines = template.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const headers = lines[0].split(",");
    expect(headers).toContain("UPN");
    expect(headers).toContain("Name");
    expect(headers).toContain("Attendance");
  });

  it("validateAgainstTemplate passes with required columns", () => {
    const { valid, missingColumns } = validateAgainstTemplate(["UPN", "Name", "YearGroup", "Attendance"]);
    expect(valid).toBe(true);
    expect(missingColumns).toHaveLength(0);
  });

  it("validateAgainstTemplate fails with missing columns", () => {
    const { valid, missingColumns } = validateAgainstTemplate(["UPN", "Name"]);
    expect(valid).toBe(false);
    expect(missingColumns).toContain("YearGroup");
    expect(missingColumns).toContain("Attendance");
  });
});
