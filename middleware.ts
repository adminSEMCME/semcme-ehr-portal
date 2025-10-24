// middleware.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Initialize Supabase client with request + response cookies
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

  // Check the user's auth session
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    // Not logged in → redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Authenticated → continue to the requested page
  return res;
}

// Apply middleware only to dashboard routes
export const config = {
  matcher: ["/dashboards/:path*"],
};
