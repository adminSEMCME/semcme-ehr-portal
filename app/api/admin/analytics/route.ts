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

  // MAIN DATA (REPLACES VIEW)
  const { data: profiles, error: joinErr } = await serviceSupabase.from(
    "profiles",
  ).select(`
      id,
      first_name,
      last_name,
      email,
      role,
      created_at,
      institution_id,
      institutions ( name ),
      module_progress (
        module_id,
        status,
        progress_percent,
        date_started,
        date_completed,
        last_accessed,
        modules (
          id,
          title,
          order_index,
          skill_level
        )
      )
    `);

  if (joinErr) {
    console.error("join error:", joinErr);
    return NextResponse.json(
      { error: "Failed to load analytics", details: joinErr.message },
      { status: 500 },
    );
  }

  // ✅ ADD THIS (separate certificates fetch)
  const { data: certificates } = await serviceSupabase
    .from("certificates")
    .select("user_id, module_id, cert_url, issued_at");

  // FLATTEN DATA (MATCHES OLD VIEW STRUCTURE)
  const userModules =
    profiles?.flatMap((user: any) => {
      const base = {
        user_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        institution: user.institutions?.name ?? null,
        role: user.role,
        user_created_at: user.created_at,
      };

      if (!user.module_progress || user.module_progress.length === 0) {
        return [
          {
            ...base,
            module_id: null,
            module_title: null,
            order_index: null,
            skill_level: null,
            status: null,
            progress_percent: null,
            date_started: null,
            date_completed: null,
            last_accessed: null,
            cert_url: null,
            cert_issued_at: null,
          },
        ];
      }

      return user.module_progress.map((mp: any) => {
        const cert = certificates?.find(
          (c) => c.user_id === user.id && c.module_id === mp.module_id,
        );

        return {
          ...base,
          module_id: mp.module_id,
          module_title: mp.modules?.title ?? null,
          order_index: mp.modules?.order_index ?? null,
          skill_level: mp.modules?.skill_level ?? null,
          status: mp.status,
          progress_percent: mp.progress_percent,
          date_started: mp.date_started,
          date_completed: mp.date_completed,
          last_accessed: mp.last_accessed,
          cert_url: cert?.cert_url ?? null,
          cert_issued_at: cert?.issued_at ?? null,
        };
      });
    }) ?? [];

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

  // Load the table itself so institutions with no profiles remain visible to
  // administrators instead of disappearing from the analytics-derived list.
  const { data: institutions, error: institutionsErr } = await serviceSupabase
    .from("institutions")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (institutionsErr) {
    console.error("institutions error:", institutionsErr);
  }

  // RETURN RESULT
  return NextResponse.json({
    userModules: userModules ?? [],
    modules: modules ?? [],
    postAssessments: postAssessments ?? [],
    institutions: institutions ?? [],
  });
}
