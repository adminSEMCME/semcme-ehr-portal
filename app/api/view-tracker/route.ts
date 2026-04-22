import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { event_type, module_id, page } = body;

    await supabase.from("analytics_events").insert([
      {
        event_type,
        module_id,
        page,
      },
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Tracking error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
