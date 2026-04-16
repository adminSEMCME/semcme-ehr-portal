// /app/api/admin/get-users/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: async () => (await cookies()).getAll(),
          setAll: async () => {
            // no-op for API routes
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ❌ Not logged in
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ❌ Not main admin
    if (user.user_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Fetch users (admin client bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        role,
        institutions(name)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = data.map((u: any) => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      institution: u.institutions?.name || null,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
