import { NextResponse } from "next/server";
import { runJourneys } from "@/lib/qualify/journeys";

/** Dev-only: runs the qualification regression suite in the app runtime. */
export function GET() {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(runJourneys());
}
