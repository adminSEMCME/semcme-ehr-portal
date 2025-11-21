// middleware.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();

  // Required new cookie API
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

  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  const pathname = req.nextUrl.pathname;
  const origin = req.nextUrl.origin;

  // Protect learner dashboard
  if (!session && pathname.startsWith("/dashboards")) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Protect admin dashboard
  if (!session && pathname.startsWith("/admin-dashboard")) {
    return NextResponse.redirect(`${origin}/login`);
  }

  return res;
}

export const config = {
  matcher: ["/dashboards/:path*", "/admin-dashboard/:path*"],
};
