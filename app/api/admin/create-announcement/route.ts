import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { title, message, target_type, cutoff_date } = body;

  const { error } = await supabase.from("announcements").insert({
    title,
    message,
    active: true,
    target_users_created_before:
      target_type === "existing" && cutoff_date
        ? new Date(cutoff_date).toISOString()
        : null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("SUPABASE INSERT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
