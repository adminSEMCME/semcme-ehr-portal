import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("SUPABASE environment variables are not configured.");
      return NextResponse.json(
        { error: "Server is not configured for password updates." },
        { status: 500 },
      );
    }

    const { password } = await request.json();

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 401 },
      );
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Password update error:", error);
      return NextResponse.json(
        { error: error.message || "Could not update your password." },
        { status: error.status && error.status >= 400 ? error.status : 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Password update route error:", err);
    return NextResponse.json(
      { error: "Could not update your password. Please try again." },
      { status: 500 },
    );
  }
}
