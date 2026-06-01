import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const allowedTypes = new Set([
  "signup",
  "recovery",
  "invite",
  "magiclink",
  "email",
  "email_change",
]);

function getSafeRedirectUrl(request: NextRequest, type: string) {
  const url = new URL(request.url);
  const requestedNext =
    url.searchParams.get("next") || url.searchParams.get("redirect_to");

  if (requestedNext) {
    try {
      const nextUrl = new URL(requestedNext, url.origin);

      if (nextUrl.origin === url.origin) {
        return nextUrl;
      }
    } catch {
      // Fall through to the default route below.
    }
  }

  if (type === "recovery") {
    return new URL("/reset-password", url.origin);
  }

  return new URL("/login?success=Email%20confirmed", url.origin);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("SUPABASE environment variables are not configured.");
    return NextResponse.redirect(
      new URL("/login?error=Confirmation%20is%20not%20configured", url.origin),
    );
  }

  if (!tokenHash || !type || !allowedTypes.has(type)) {
    return NextResponse.redirect(
      new URL("/login?error=Invalid%20confirmation%20link", url.origin),
    );
  }

  const cookiesToSet: {
    name: string;
    value: string;
    options?: Record<string, any>;
  }[] = [];
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(...cookies);
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as any,
  });

  if (error) {
    console.error("Supabase confirmation error:", error);
    return NextResponse.redirect(
      new URL("/login?error=Confirmation%20failed", url.origin),
    );
  }

  const redirectUrl = getSafeRedirectUrl(request, type);
  const response = NextResponse.redirect(redirectUrl);

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
