import { describe, expect, it } from "vitest";
import { computeSlotKey, isValidEmail, parseTimetableCsv } from "@/modules/timetable/timetable-import";
import { suggestTimetableMapping, computeHeaderSignature } from "@/modules/timetable/timetable-fields";

// ─── computeSlotKey ────────────────────────────────────────────────────────────

describe("computeSlotKey", () => {
  it("returns day+period key when dayOfWeek and period are present", () => {
    expect(computeSlotKey(2, "3", null, null, null)).toBe("D2-P3-ALL");
    expect(computeSlotKey(2, "3", "A", null, null)).toBe("D2-P3-A");
    expect(computeSlotKey(5, "1", "AB", null, null)).toBe("D5-P1-AB");
  });

  it("returns time-based key when startTime and endTime are present but no day/period", () => {
    expect(computeSlotKey(null, null, null, "09:00", "10:00")).toBe("09:00-10:00-ALL");
    expect(computeSlotKey(null, null, "B", "09:00", "10:00")).toBe("09:00-10:00-B");
  });

  it("prefers day+period over time when both are present", () => {
    expect(computeSlotKey(1, "2", "A", "09:00", "10:00")).toBe("D1-P2-A");
  });

  it("returns null when no slot info", () => {
    expect(computeSlotKey(null, null, null, null, null)).toBeNull();
    expect(computeSlotKey(null, null, "A", null, null)).toBeNull();
  });

  it("normalises weekPattern to uppercase", () => {
    expect(computeSlotKey(1, "2", "ab", null, null)).toBe("D1-P2-AB");
  });
});

// ─── isValidEmail ──────────────────────────────────────────────────────────────

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("teacher@school.edu")).toBe(true);
    expect(isValidEmail("j.smith@example.co.uk")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("no@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

// ─── parseTimetableCsv ─────────────────────────────────────────────────────────

const IDENTITY_MAPPING = {
  ClassCode: "ClassCode",
  Subject: "Subject",
  YearGroup: "YearGroup",
  TeacherEmail: "TeacherEmail",
  DayOfWeek: "DayOfWeek",
  Period: "Period",
  Room: "Room",
  WeekPattern: "WeekPattern",
  StartTime: "StartTime",
  EndTime: "EndTime",
};

const VALID_CSV = [
  "ClassCode,Subject,YearGroup,TeacherEmail,DayOfWeek,Period,Room,WeekPattern,StartTime,EndTime",
  "10A/Ma1,Mathematics,10,j.smith@school.edu,2,3,B12,A,09:00,10:00",
  "10A/En1,English,10,e.jones@school.edu,3,1,A01,A,10:00,11:00",
].join("\n");

describe("parseTimetableCsv", () => {
  it("parses a valid row", () => {
    const { rows, errors } = parseTimetableCsv(VALID_CSV, IDENTITY_MAPPING);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].classCode).toBe("10A/Ma1");
    expect(rows[0].subject).toBe("Mathematics");
    expect(rows[0].yearGroup).toBe("10");
    expect(rows[0].teacherEmail).toBe("j.smith@school.edu");
    expect(rows[0].dayOfWeek).toBe(2);
    expect(rows[0].period).toBe("3");
    expect(rows[0].room).toBe("B12");
    expect(rows[0].weekPattern).toBe("A");
    expect(rows[0].startTime).toBe("09:00");
    expect(rows[0].endTime).toBe("10:00");
    expect(rows[0].slotKey).toBe("D2-P3-A");
  });

  it("errors on missing ClassCode", () => {
    const csv = [
      "ClassCode,Subject,YearGroup,TeacherEmail",
      ",Mathematics,10,t@school.edu",
    ].join("\n");
    const { errors } = parseTimetableCsv(csv, IDENTITY_MAPPING);
    expect(errors.some((e) => e.errorCode === "MISSING_CLASS_CODE")).toBe(true);
  });

  it("errors on invalid YearGroup", () => {
    const csv = [
      "ClassCode,Subject,YearGroup,TeacherEmail",
      "10A/Ma1,Mathematics,6,t@school.edu",
    ].join("\n");
    const { errors } = parseTimetableCsv(csv, IDENTITY_MAPPING);
    expect(errors.some((e) => e.errorCode === "INVALID_YEAR_GROUP")).toBe(true);
  });

  it("errors on invalid TeacherEmail", () => {
    const csv = [
      "ClassCode,Subject,YearGroup,TeacherEmail",
      "10A/Ma1,Mathematics,10,notanemail",
    ].join("\n");
    const { errors } = parseTimetableCsv(csv, IDENTITY_MAPPING);
    expect(errors.some((e) => e.errorCode === "INVALID_TEACHER_EMAIL")).toBe(true);
  });

  it("errors on invalid DayOfWeek", () => {
    const csv = [
      "ClassCode,Subject,YearGroup,TeacherEmail,DayOfWeek",
      "10A/Ma1,Mathematics,10,t@school.edu,8",
    ].join("\n");
    const { errors } = parseTimetableCsv(csv, IDENTITY_MAPPING);
    expect(errors.some((e) => e.errorCode === "INVALID_DAY_OF_WEEK")).toBe(true);
  });

  it("produces MISSING_SLOT_INFO conflict when no slot info", () => {
    const csv = [
      "ClassCode,Subject,YearGroup,TeacherEmail",
      "10A/Ma1,Mathematics,10,t@school.edu",
    ].join("\n");
    const { rows, conflicts, errors } = parseTimetableCsv(csv, {
      ClassCode: "ClassCode",
      Subject: "Subject",
      YearGroup: "YearGroup",
      TeacherEmail: "TeacherEmail",
    });
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].slotKey).toBeNull();
    expect(conflicts.some((c) => c.conflictCode === "MISSING_SLOT_INFO")).toBe(true);
  });

  it("errors on duplicate row in same file", () => {
    const csv = [
      "ClassCode,Subject,YearGroup,TeacherEmail,DayOfWeek,Period",
      "10A/Ma1,Mathematics,10,t@school.edu,2,3",
      "10A/Ma1,Mathematics,10,other@school.edu,2,3",
    ].join("\n");
    const { errors } = parseTimetableCsv(csv, IDENTITY_MAPPING);
    expect(errors.some((e) => e.errorCode === "DUPLICATE_ROW")).toBe(true);
  });

  it("accepts YearGroup with Y prefix", () => {
    const csv = [
      "ClassCode,Subject,YearGroup,TeacherEmail",
      "10A/Ma1,Mathematics,Y10,t@school.edu",
    ].join("\n");
    const { rows, errors } = parseTimetableCsv(csv, {
      ClassCode: "ClassCode",
      Subject: "Subject",
      YearGroup: "YearGroup",
      TeacherEmail: "TeacherEmail",
    });
    expect(errors).toHaveLength(0);
    expect(rows[0].yearGroup).toBe("10");
  });

  it("handles custom column mapping", () => {
    const csv = [
      "Code,Subj,Year,Email,Day,Per",
      "10A/Ma1,Maths,10,t@school.edu,1,2",
    ].join("\n");
    const mapping = {
      ClassCode: "Code",
      Subject: "Subj",
      YearGroup: "Year",
      TeacherEmail: "Email",
      DayOfWeek: "Day",
      Period: "Per",
    };
    const { rows, errors } = parseTimetableCsv(csv, mapping);
    expect(errors).toHaveLength(0);
    expect(rows[0].classCode).toBe("10A/Ma1");
    expect(rows[0].dayOfWeek).toBe(1);
  });

  it("returns preview rows (up to 10)", () => {
    const { preview } = parseTimetableCsv(VALID_CSV, IDENTITY_MAPPING);
    expect(preview.length).toBe(2);
    expect(preview[0]["ClassCode"]).toBe("10A/Ma1");
  });
});

// ─── suggestTimetableMapping ───────────────────────────────────────────────────

describe("suggestTimetableMapping", () => {
  it("suggests fields by exact header name", () => {
    const mapping = suggestTimetableMapping([
      "ClassCode", "Subject", "YearGroup", "TeacherEmail", "DayOfWeek", "Period", "Room",
    ]);
    expect(mapping.ClassCode).toBe("ClassCode");
    expect(mapping.Subject).toBe("Subject");
    expect(mapping.TeacherEmail).toBe("TeacherEmail");
    expect(mapping.Room).toBe("Room");
  });

  it("suggests fields by synonym", () => {
    const mapping = suggestTimetableMapping(["Class Code", "Year Group", "Teacher Email"]);
    expect(mapping.ClassCode).toBe("Class Code");
    expect(mapping.YearGroup).toBe("Year Group");
    expect(mapping.TeacherEmail).toBe("Teacher Email");
  });
});

// ─── computeHeaderSignature ────────────────────────────────────────────────────

describe("computeHeaderSignature", () => {
  it("produces a sorted, lowercased, pipe-joined string", () => {
    const sig = computeHeaderSignature(["ClassCode", "Subject", "YearGroup"]);
    expect(sig).toBe("classcode|subject|yeargroup");
  });

  it("is order-independent", () => {
    const sig1 = computeHeaderSignature(["A", "B", "C"]);
    const sig2 = computeHeaderSignature(["C", "A", "B"]);
    expect(sig1).toBe(sig2);
  });
});
