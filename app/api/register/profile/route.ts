import { NextResponse } from "next/server";

// /api/register creates profiles. Retire the unused anonymous profile upsert
// so it cannot bypass admin-only institution editing.
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is no longer available. Use the registration form." },
    { status: 410 },
  );
}
