// Anaxi field names for timetable import mapping

export const TIMETABLE_REQUIRED_FIELDS = [
  "ClassCode",
  "Subject",
  "YearGroup",
  "TeacherEmail",
] as const;

export const TIMETABLE_OPTIONAL_FIELDS = [
  "DayOfWeek",
  "Period",
  "Room",
  "WeekPattern",
  "StartTime",
  "EndTime",
] as const;

export type TimetableRequiredField = (typeof TIMETABLE_REQUIRED_FIELDS)[number];
export type TimetableOptionalField = (typeof TIMETABLE_OPTIONAL_FIELDS)[number];
export type TimetableField = TimetableRequiredField | TimetableOptionalField;

export const ALL_TIMETABLE_FIELDS: TimetableField[] = [
  ...TIMETABLE_REQUIRED_FIELDS,
  ...TIMETABLE_OPTIONAL_FIELDS,
];

/** Synonyms for fuzzy auto-suggest of column mapping */
export const TIMETABLE_FIELD_SYNONYMS: Record<TimetableField, string[]> = {
  ClassCode:    ["ClassCode", "Class Code", "class_code", "Class", "GroupCode", "Group Code"],
  Subject:      ["Subject", "subject", "SubjectName", "Subject Name"],
  YearGroup:    ["YearGroup", "Year Group", "Year", "year_group"],
  TeacherEmail: ["TeacherEmail", "Teacher Email", "teacher_email", "Email", "StaffEmail"],
  DayOfWeek:    ["DayOfWeek", "Day Of Week", "Day", "day_of_week", "DayNum"],
  Period:       ["Period", "period", "PeriodNum", "Lesson"],
  Room:         ["Room", "room", "RoomCode", "Location"],
  WeekPattern:  ["WeekPattern", "Week Pattern", "WeekType", "Week", "week_pattern"],
  StartTime:    ["StartTime", "Start Time", "start_time", "StartAt"],
  EndTime:      ["EndTime", "End Time", "end_time", "EndAt"],
};

/** Compute a normalised header signature for auto-matching saved mappings */
export function computeHeaderSignature(headers: string[]): string {
  return headers
    .map((h) => h.trim().toLowerCase())
    .sort()
    .join("|");
}

/** Attempt to auto-suggest a CSV header for each timetable field (case-insensitive) */
export function suggestTimetableMapping(
  headers: string[],
): Partial<Record<TimetableField, string>> {
  const lower = headers.map((h) => ({ original: h, lower: h.trim().toLowerCase() }));

  const findHeader = (synonyms: string[]) => {
    for (const syn of synonyms) {
      const found = lower.find((h) => h.lower === syn.toLowerCase());
      if (found) return found.original;
    }
    return undefined;
  };

  const result: Partial<Record<TimetableField, string>> = {};
  for (const field of ALL_TIMETABLE_FIELDS) {
    const match = findHeader(TIMETABLE_FIELD_SYNONYMS[field]);
    if (match) result[field] = match;
  }
  return result;
}
