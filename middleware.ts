// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // We only create login session ONCE:
  // When the session first becomes valid (auth callback OR initial request after login)
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (user) {
    // Check if there is already an "open" session
    const { data: open, error: openErr } = await supabase
      .from("user_sessions")
      .select("id")
      .eq("user_id", user.id)
      .is("logout_time", null);

    // Only insert a new session if none exists
    if (!openErr && open.length === 0) {
      await supabase.from("user_sessions").insert({
        user_id: user.id,
        login_time: new Date().toISOString(),
        ip_address:
          req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
        user_agent: req.headers.get("user-agent") ?? null,
      });
    }
  }

  return res;
}

// Protect dashboards ONLY—not all routes.
// This prevents middleware from firing repeatedly & inserting duplicates.
export const config = {
  matcher: [
    "/admin-dashboard/:path*",
    "/dashboards/:path*",
    "/modules/:path*",
    "/auth/callback", // ensures first-login fires once
  ],
};
