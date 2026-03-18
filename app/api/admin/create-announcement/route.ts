import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      title,
      message,
      target_type,
      cutoff_date,
      target_roles,
      target_email,
    } = body;

    const { error } = await supabase.from("announcements").insert({
      title,
      message,
      active: true,

      // ✅ EXISTING LOGIC (unchanged)
      target_users_created_before:
        target_type === "existing" && cutoff_date
          ? new Date(cutoff_date).toISOString()
          : null,

      created_at: new Date().toISOString(),

      // ✅ NEW FIELDS
      target_type: target_type || "all",
      target_roles:
        target_type === "role" && target_roles?.length ? target_roles : null,
      target_user_email:
        target_type === "user" && target_email ? target_email : null,
    });

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CREATE ANNOUNCEMENT ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 },
    );
  }
}
