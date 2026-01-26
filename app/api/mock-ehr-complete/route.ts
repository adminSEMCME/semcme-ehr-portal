// app/api/mock-ehr-complete/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MOCK_EHR_MODULE_ID = "mock-ehr";

export async function POST(request: Request) {
  try {
    const internalKey = request.headers.get("x-internal-key");

    if (internalKey !== process.env.MOCK_EHR_INTERNAL_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { module_id, sub } = await request.json();

    if (!module_id || !sub) {
      return NextResponse.json(
        { error: "Missing module_id or sub" },
        { status: 400 },
      );
    }

    if (module_id !== MOCK_EHR_MODULE_ID) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    await admin.from("module_progress").upsert(
      {
        user_id: sub,
        module_id,
        status: "completed",
        progress_percent: 100,
        date_completed: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Mock EHR completion failed:", err);
    return NextResponse.json(
      { error: "Mock EHR completion failed" },
      { status: 500 },
    );
  }
}
