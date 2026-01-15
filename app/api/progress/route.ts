import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const MOCK_EHR_MODULE_ID = "mock-ehr";

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

    // user-scoped client
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

    const userId = userData.user.id;

    // admin client
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { module_id, status = "in_progress", progress_percent } = body;

    if (!module_id) {
      return NextResponse.json({ error: "Missing module_id" }, { status: 400 });
    }

    /*****************************************
     * MOCK-EHR ONE-TIME COMPLETION GUARD
     *****************************************/
    if (module_id === MOCK_EHR_MODULE_ID && status === "completed") {
      const { data: existing } = await admin
        .from("module_progress")
        .select("status")
        .eq("user_id", userId)
        .eq("module_id", module_id)
        .maybeSingle();

      if (existing?.status === "completed") {
        return NextResponse.json({
          success: true,
          message: "Mock-EHR already completed",
        });
      }
    }

    const payload: any = {
      user_id: userId,
      module_id,
      status,
      progress_percent: status === "completed" ? 100 : progress_percent ?? 0,
      last_accessed: new Date().toISOString(),
    };

    if (status === "in_progress") {
      payload.date_started = new Date().toISOString();
    }

    if (status === "completed") {
      payload.date_completed = new Date().toISOString();
    }

    await supabase
      .from("module_progress")
      .upsert(payload, { onConflict: "user_id,module_id" });

    /*****************************************
     * CERT LOGIC
     *  - mock-ehr: immediate
     *  - others: require post-assessment
     *****************************************/
    if (status === "completed") {
      if (module_id !== MOCK_EHR_MODULE_ID) {
        const { data: assessment } = await admin
          .from("post_assessments")
          .select("id")
          .eq("user_id", userId)
          .eq("module_id", module_id)
          .maybeSingle();

        if (!assessment) {
          return NextResponse.json({
            success: true,
            message: "Completed, assessment pending",
          });
        }
      }

      await fetch(
        `${getBaseUrlFromRequest(request)}/api/certificates/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ module_id, user_id: userId }),
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update module progress" },
      { status: 500 }
    );
  }
}
