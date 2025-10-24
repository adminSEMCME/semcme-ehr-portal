// middleware.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname, origin } = req.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getSession();
  const session = data?.session;

  // Redirect unauthenticated users trying to access dashboards
  if (error || !session) {
    if (pathname.startsWith("/dashboards")) {
      return NextResponse.redirect(`${origin}/login`);
    }
    return res;
  }

  // Allow authenticated users through
  return res;
}

export const config = {
  matcher: ["/dashboards/:path*"],
};