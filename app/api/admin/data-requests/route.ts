//app/api/admin/data-requests/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from("institution_data_requests")
      .select(
        `
          id,
          created_at,
          report_type,
          status,
          module_scope,
          selected_modules,
          additional_notes,
          individual_user_email,
          institutions(name),
          profiles!institution_data_requests_requested_by_fkey(email)
        `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = data.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      report_type: r.report_type,
      status: r.status,
      institution_name: (r.institutions as any)?.name ?? "Unknown",
      requestor_email: (r.profiles as any)?.email ?? "Unknown",
      individual_user_email: r.individual_user_email,
      module_scope: r.module_scope,
      selected_modules: r.selected_modules,
      additional_notes: r.additional_notes,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json(
      { error: "Failed to load requests" },
      { status: 500 },
    );
  }
}
