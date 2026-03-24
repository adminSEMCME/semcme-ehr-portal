// app/api/admin/institution-admins/route.ts

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
        `
          id,
          first_name,
          last_name,
          email,
          oversee_role,
          is_approved,
          is_denied,
          institution_id,
          institutions(name)
        `,
      )
      .eq("role", "Institution Administrator");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = data.map((a) => ({
      id: a.id,
      first_name: a.first_name,
      last_name: a.last_name,
      email: a.email,
      oversee_role: a.oversee_role,
      is_approved: a.is_approved,
      is_denied: a.is_denied,
      institution_name: (a.institutions as any)?.name ?? "Unknown",
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load institution admins", details: err?.message },
      { status: 500 },
    );
  }
}
