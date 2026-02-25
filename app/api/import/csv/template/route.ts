import { NextResponse } from "next/server";
import { generateCSVTemplate } from "@/modules/import/csv-templates";

export async function GET() {
  const csv = generateCSVTemplate();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="student-snapshot-template.csv"',
    },
  });
}
