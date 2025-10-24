// app/api/progress/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = userData.user.id;

    // 🧩 Gracefully handle empty body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const {
      module_id,
      status = "in_progress",
      progress_percent = 0,
      date_completed,
    } = body;

    if (!module_id) {
      return NextResponse.json({ error: "Missing module_id" }, { status: 400 });
    }

    const payload: any = {
      user_id: userId,
      module_id,
      status,
      progress_percent,
      last_accessed: new Date().toISOString(),
    };

    if (status === "in_progress" && !date_completed) {
      payload.date_started = payload.date_started || new Date().toISOString();
    }

    if (status === "completed") {
      payload.date_completed = date_completed || new Date().toISOString();
      payload.progress_percent = 100;
    }

    const { data, error } = await supabase
      .from("module_progress")
      .upsert(payload, { onConflict: "user_id,module_id" })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error updating module progress:", err);
    return NextResponse.json(
      { error: "Failed to update module progress", details: String(err) },
      { status: 500 }
    );
  }
}
