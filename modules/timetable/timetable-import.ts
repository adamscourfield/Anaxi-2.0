import type { TimetableField, TimetableRequiredField } from "./timetable-fields";
import { TIMETABLE_REQUIRED_FIELDS } from "./timetable-fields";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TimetableMapping = Partial<Record<TimetableField, string>>;

export interface TimetableRow {
  rowNumber: number;
  classCode: string;
  subject: string;
  yearGroup: string;
  teacherEmail: string;
  dayOfWeek: number | null;
  period: string | null;
  room: string | null;
  weekPattern: string | null;
  startTime: string | null;
  endTime: string | null;
  slotKey: string | null;
}

export interface TimetableError {
  rowNumber: number;
  classCode: string;
  errorCode: string;
  message: string;
}

export interface TimetableConflict {
  rowNumber: number;
  classCode: string;
  teacherEmail: string;
  conflictCode: string;
  message: string;
}

export interface TimetableParseResult {
  rows: TimetableRow[];
  errors: TimetableError[];
  conflicts: TimetableConflict[];
  preview: Record<string, string>[];
}

// ─── Slot key computation ─────────────────────────────────────────────────────

/**
 * Derive a "slot key" string that uniquely identifies a slot within a class.
 * Returns null when not enough info is present (MISSING_SLOT_INFO).
 */
export function computeSlotKey(
  dayOfWeek: number | null,
  period: string | null,
  weekPattern: string | null,
  startTime: string | null,
  endTime: string | null,
): string | null {
  const wp = (weekPattern ?? "ALL").toUpperCase();
  if (dayOfWeek != null && period != null) {
    return `D${dayOfWeek}-P${period}-${wp}`;
  }
  if (startTime && endTime) {
    return `${startTime}-${endTime}-${wp}`;
  }
  return null;
}

// ─── Email validation ─────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────

function getCell(cols: string[], headers: string[], sourceHeader: string | undefined): string {
  if (!sourceHeader) return "";
  const idx = headers.indexOf(sourceHeader);
  if (idx < 0) return "";
  return (cols[idx] ?? "").trim();
}

/**
 * Parse a timetable CSV with the given column mapping.
 * Returns valid rows, errors (hard failures), conflicts (soft issues), and preview rows.
 */
export function parseTimetableCsv(
  csvText: string,
  mapping: TimetableMapping,
): TimetableParseResult {
  const lines = csvText.split(/\r?\n/);
  const headerLine = lines[0] ?? "";
  const headers = headerLine.split(",").map((h) => h.trim());

  const rows: TimetableRow[] = [];
  const errors: TimetableError[] = [];
  const conflicts: TimetableConflict[] = [];
  const preview: Record<string, string>[] = [];

  // Track in-file duplicates: classCode+slotKey
  const seenSlotKeys = new Set<string>();

  const dataLines = lines.slice(1).filter((l) => l.trim() !== "");

  for (let i = 0; i < dataLines.length; i++) {
    const rowNumber = i + 2; // 1-based, row 1 = header
    const cols = dataLines[i].split(",");

    // Build preview row (first 10)
    if (i < 10) {
      preview.push(Object.fromEntries(headers.map((h, idx) => [h, (cols[idx] ?? "").trim()])));
    }

    // Extract fields via mapping
    const classCode = getCell(cols, headers, mapping.ClassCode);
    const subject = getCell(cols, headers, mapping.Subject);
    const yearGroupRaw = getCell(cols, headers, mapping.YearGroup);
    const teacherEmail = getCell(cols, headers, mapping.TeacherEmail);

    const dayOfWeekRaw = getCell(cols, headers, mapping.DayOfWeek);
    const period = getCell(cols, headers, mapping.Period) || null;
    const room = getCell(cols, headers, mapping.Room) || null;
    const weekPattern = getCell(cols, headers, mapping.WeekPattern) || null;
    const startTime = getCell(cols, headers, mapping.StartTime) || null;
    const endTime = getCell(cols, headers, mapping.EndTime) || null;

    // ── Required field validation ───────────────────────────────────────────

    if (!classCode) {
      errors.push({ rowNumber, classCode: "", errorCode: "MISSING_CLASS_CODE", message: "ClassCode is required" });
      continue;
    }
    if (!subject) {
      errors.push({ rowNumber, classCode, errorCode: "MISSING_SUBJECT", message: "Subject is required" });
      continue;
    }
    if (!yearGroupRaw) {
      errors.push({ rowNumber, classCode, errorCode: "MISSING_YEAR_GROUP", message: "YearGroup is required" });
      continue;
    }

    // YearGroup must be int 7–13
    const yearGroupNum = parseInt(yearGroupRaw.replace(/[^0-9]/g, ""), 10);
    if (isNaN(yearGroupNum) || yearGroupNum < 7 || yearGroupNum > 13) {
      errors.push({
        rowNumber,
        classCode,
        errorCode: "INVALID_YEAR_GROUP",
        message: `YearGroup must be between 7 and 13 (got "${yearGroupRaw}")`,
      });
      continue;
    }
    const yearGroup = String(yearGroupNum);

    if (!teacherEmail) {
      errors.push({ rowNumber, classCode, errorCode: "MISSING_TEACHER_EMAIL", message: "TeacherEmail is required" });
      continue;
    }
    if (!isValidEmail(teacherEmail)) {
      errors.push({
        rowNumber,
        classCode,
        errorCode: "INVALID_TEACHER_EMAIL",
        message: `TeacherEmail is not a valid email address (got "${teacherEmail}")`,
      });
      continue;
    }

    // ── Optional field validation ───────────────────────────────────────────

    let dayOfWeek: number | null = null;
    if (dayOfWeekRaw) {
      const d = parseInt(dayOfWeekRaw, 10);
      if (isNaN(d) || d < 1 || d > 7) {
        errors.push({
          rowNumber,
          classCode,
          errorCode: "INVALID_DAY_OF_WEEK",
          message: `DayOfWeek must be 1–7 (got "${dayOfWeekRaw}")`,
        });
        continue;
      }
      dayOfWeek = d;
    }

    // ── Slot key ────────────────────────────────────────────────────────────

    const slotKey = computeSlotKey(dayOfWeek, period, weekPattern, startTime, endTime);

    if (!slotKey) {
      // MISSING_SLOT_INFO is a conflict (soft warning), not a hard error — still import the row
      conflicts.push({
        rowNumber,
        classCode,
        teacherEmail,
        conflictCode: "MISSING_SLOT_INFO",
        message: "No DayOfWeek/Period or StartTime/EndTime provided; entry will not appear in schedule views",
      });
    }

    // ── Duplicate in file ───────────────────────────────────────────────────

    if (slotKey !== null) {
      const dupKey = `${classCode}|||${slotKey}`;
      if (seenSlotKeys.has(dupKey)) {
        errors.push({
          rowNumber,
          classCode,
          errorCode: "DUPLICATE_ROW",
          message: `Duplicate row: classCode "${classCode}" with slotKey "${slotKey}"`,
        });
        continue;
      }
      seenSlotKeys.add(dupKey);
    }

    rows.push({
      rowNumber,
      classCode,
      subject,
      yearGroup,
      teacherEmail,
      dayOfWeek,
      period,
      room,
      weekPattern,
      startTime,
      endTime,
      slotKey,
    });
  }

  return { rows, errors, conflicts, preview };
}
