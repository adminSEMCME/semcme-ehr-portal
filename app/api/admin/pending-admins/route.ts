import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, email, role, is_approved, institution_id",
      )
      .eq("role", "Institution Administrator")
      .eq("is_approved", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load pending admins", details: err?.message },
      { status: 500 },
    );
  }
}
