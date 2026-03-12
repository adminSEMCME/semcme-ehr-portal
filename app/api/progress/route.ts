import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { module_id, status, date_completed } = body;
    let { progress_percent } = body;

    if (!module_id) {
      return NextResponse.json({ error: "Missing module_id" }, { status: 400 });
    }

    // ✅ MUST await cookies()
    const cookieStore = await cookies();

    // User-scoped client (session-based)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );

    const { data: userData } = await supabase.auth.getUser();

    if (userData?.user) {
      const { data: existing } = await supabase
        .from("module_progress")
        .select("progress_percent,status")
        .eq("user_id", userData.user.id)
        .eq("module_id", module_id)
        .single();

      if (existing) {
        if (existing.status === "completed") {
          return NextResponse.json({ success: true });
        }

        if (progress_percent < existing.progress_percent) {
          progress_percent = existing.progress_percent;
        }
      }

      await supabase.from("module_progress").upsert(
        {
          user_id: userData.user.id,
          module_id,
          status,
          progress_percent,
          date_completed: status === "completed" ? date_completed : null,
          last_accessed: new Date().toISOString(),
        },
        { onConflict: "user_id,module_id" },
      );

      return NextResponse.json({ success: true });
    }

    // ✅ Fallback path (Storyline exit / keepalive / unload)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    await admin.from("module_progress").upsert(
      {
        module_id,
        status,
        progress_percent,
        date_completed: status === "completed" ? date_completed : null,
        last_accessed: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Progress update failed:", err);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 },
    );
  }
}
