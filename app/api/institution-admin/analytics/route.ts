// api/institution-admin/analytics/route.ts
import { createClient } from "@supabase/supabase-js";
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

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // AUTH CHECK
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // GET PROFILE
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
        role,
        oversee_role,
        institutions ( name )
      `,
    )
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "Institution Administrator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const institutionName = (profile.institutions as any)?.name;

  /* =========================
     REPLACEMENT FOR VIEW
  ========================= */
  const { data: profiles, error: joinErr } = await serviceSupabase.from(
    "profiles",
  ).select(`
      id,
      first_name,
      last_name,
      email,
      role,
      created_at,
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
    console.error(joinErr);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }

  /* =========================
     CERTIFICATES (SEPARATE)
  ========================= */
  const { data: certificates } = await serviceSupabase
    .from("certificates")
    .select("user_id, module_id, cert_url, issued_at");

  /* =========================
     BUILD DATA (same shape as before)
  ========================= */
  let userModules =
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

  /* =========================
     🔥 CRITICAL: IA FILTER (SERVER SIDE)
  ========================= */
  userModules = userModules.filter(
    (row: any) =>
      row.institution === institutionName && row.role === profile.oversee_role,
  );

  // MODULES (unchanged)
  const { data: modules } = await serviceSupabase
    .from("modules")
    .select("id, title, skill_level, order_index")
    .order("order_index", { ascending: true });

  return NextResponse.json({
    userModules: userModules ?? [],
    modules: modules ?? [],
  });
}
