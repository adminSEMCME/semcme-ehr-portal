// app/api/sessions/start/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDeviceType(userAgent: string | null) {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();

  if (/mobile|iphone|android/.test(ua)) return "mobile";
  if (/ipad|tablet/.test(ua)) return "tablet";
  return "desktop";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, page_path, screen_width, screen_height, referrer } = body;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 🌐 Network info (server-trusted)
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      null;

    const user_agent = req.headers.get("user-agent");
    const device_type = getDeviceType(user_agent);

    const { error } = await admin.from("user_sessions").insert({
      user_id,
      login_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      page_path: page_path || "/dashboards",
      referrer,
      device_type,
      user_agent,
      screen_width,
      screen_height,
      ip_address,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
