// app/api/progress/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function getBaseUrlFromRequest(req: Request) {
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (req.url.startsWith("https") ? "https" : "http");

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    process.env.VERCEL_URL ||
    "";

  if (host.startsWith("http")) return host;
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // User-scoped client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) =>
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            ),
        },
      }
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = userData.user;
    const userId = user.id;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
    }

    // Admin client (for assessment + cert existence checks)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = (await request.json().catch(() => ({}))) as any;
    const {
      module_id,
      status = "in_progress",
      progress_percent = 0,
      date_completed,
    } = body;

    if (!module_id) {
      return NextResponse.json({ error: "Missing module_id" }, { status: 400 });
    }

    const { data: existingProgress } = await supabase
      .from("module_progress")
      .select("status")
      .eq("user_id", userId)
      .eq("module_id", module_id)
      .maybeSingle();

    const { data: existingCert } = await admin
      .from("certificates")
      .select("id")
      .eq("user_id", userId)
      .eq("module_id", module_id)
      .maybeSingle();

    if (existingProgress?.status === "completed" && existingCert) {
      return NextResponse.json({
        success: true,
        message: "Module already completed",
      });
    }

    const payload: any = {
      user_id: userId,
      module_id,
      status,
      progress_percent,
      last_accessed: new Date().toISOString(),
    };

    if (status === "in_progress" && !date_completed) {
      payload.date_started = new Date().toISOString();
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

    // 🚫 BLOCK CERT IF POST-ASSESSMENT NOT SUBMITTED
    if (status === "completed") {
      const { data: assessment } = await admin
        .from("post_assessments")
        .select("id")
        .eq("user_id", userId)
        .eq("module_id", module_id)
        .maybeSingle();

      if (!assessment) {
        return NextResponse.json({
          success: true,
          message: "Module completed, assessment not yet submitted",
          assessmentRequired: true,
        });
      }

      // ✅ Trigger certificate generation
      await fetch(
        `${getBaseUrlFromRequest(request)}/api/certificates/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module_id,
            user_id: userId,
          }),
        }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error updating module progress:", err);
    return NextResponse.json(
      { error: "Failed to update module progress", details: String(err) },
      { status: 500 }
    );
  }
}
