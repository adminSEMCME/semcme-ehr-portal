import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("SUPABASE environment variables are not configured.");
      return NextResponse.json(
        { error: "Server is not configured for password resets." },
        { status: 500 },
      );
    }

    const { email } = await req.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 },
      );
    }

    const origin = new URL(req.url).origin;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${origin}/reset-password`,
      },
    );

    if (error) {
      console.error("Supabase password reset error:", error);

      if (
        error.message?.toLowerCase().includes("rate limit") ||
        error.message?.toLowerCase().includes("too many")
      ) {
        return NextResponse.json(
          {
            error:
              "Too many reset attempts. Please wait a few minutes and try again.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Unable to send password reset email." },
        { status: error.status && error.status >= 400 ? error.status : 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Password reset route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while sending the reset email." },
      { status: 500 },
    );
  }
}
