import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function jsonWithCookies(
  body: Record<string, unknown>,
  status: number,
  cookiesToSet: {
    name: string;
    value: string;
    options?: Record<string, any>;
  }[],
) {
  const response = NextResponse.json(body, { status });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

export async function POST(request: NextRequest) {
  const cookiesToSet: {
    name: string;
    value: string;
    options?: Record<string, any>;
  }[] = [];

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("SUPABASE environment variables are not configured.");
      return NextResponse.json(
        { error: "Server is not configured for sign in." },
        { status: 500 },
      );
    }

    const { email, password, moduleId } = await request.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data?.user) {
      return jsonWithCookies(
        {
          error: "Incorrect email or password.",
          authMessage: error?.message || null,
        },
        error?.status && error.status >= 400 ? error.status : 401,
        cookiesToSet,
      );
    }

    if (data.user.user_metadata?.role === "admin") {
      return jsonWithCookies(
        {
          success: true,
          user_id: data.user.id,
          redirectTo: "/admin-dashboard",
        },
        200,
        cookiesToSet,
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_approved")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Login profile lookup failed:", profileError);
      await supabase.auth.signOut();

      return jsonWithCookies(
        { error: "Unable to load your account profile. Please try again." },
        500,
        cookiesToSet,
      );
    }

    if (
      profile.role === "Institution Administrator" &&
      !profile.is_approved
    ) {
      await supabase.auth.signOut();

      return jsonWithCookies(
        {
          error:
            "Your Institution Administrator account is pending approval. You will receive access once approved.",
        },
        403,
        cookiesToSet,
      );
    }

    const redirectTo =
      profile.role === "Institution Administrator"
        ? "/institution-admin"
        : moduleId
          ? `/dashboards?module=${encodeURIComponent(String(moduleId))}`
          : "/dashboards";

    return jsonWithCookies(
      {
        success: true,
        user_id: data.user.id,
        redirectTo,
      },
      200,
      cookiesToSet,
    );
  } catch (err) {
    console.error("Login route error:", err);
    return jsonWithCookies(
      { error: "Unexpected login error. Please try again." },
      500,
      cookiesToSet,
    );
  }
}
