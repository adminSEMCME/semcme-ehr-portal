// app/api/admin/analytics/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    },
  );

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // AUTH CHECK
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData?.user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (userData.user.user_metadata?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // MAIN JOIN VIEW
  const { data: userModules, error: joinErr } = await serviceSupabase
    .from("admin_user_module_join")
    .select("*");

  if (joinErr) {
    console.error("join error:", joinErr);
    return NextResponse.json(
      { error: "Failed to load analytics", details: joinErr.message },
      { status: 500 },
    );
  }

  // ALL MODULES (for filters + "not started")
  const { data: modules, error: modulesErr } = await serviceSupabase
    .from("modules")
    .select("id, title, order_index, skill_level")
    .order("order_index", { ascending: true });

  const { data: postAssessments, error: postAssessmentsErr } =
    await serviceSupabase
      .from("post_assessments")
      .select("*")
      .order("submitted_at", { ascending: false });

  if (postAssessmentsErr) {
    console.error("post assessments error:", postAssessmentsErr);
  }

  if (modulesErr) {
    console.error("modules error:", modulesErr);
  }

  // RETURN RESULT
  return NextResponse.json({
    userModules: userModules ?? [],
    modules: modules ?? [],
    postAssessments: postAssessments ?? [],
  });
}
