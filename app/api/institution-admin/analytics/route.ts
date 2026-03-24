import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  // ✅ AUTH CHECK (THIS FIXES YOUR 401)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ✅ GET PROFILE (to verify IA role)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "Institution Administrator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ✅ GET DATA (same join you're already using)
  const { data: userModules, error: joinErr } = await supabase
    .from("admin_user_module_join")
    .select("*");

  if (joinErr) {
    console.error(joinErr);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }

  // ✅ MODULES (for dropdown + table)
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, skill_level, order_index")
    .order("order_index", { ascending: true });

  return NextResponse.json({
    userModules: userModules ?? [],
    modules: modules ?? [],
  });
}
