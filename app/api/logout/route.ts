import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const url = new URL(request.url);
  const reason = url.searchParams.get("reason") || "manual_logout";

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("user_sessions")
        .update({
          logout_time: new Date().toISOString(),
          logout_reason: reason,
        })
        .eq("user_id", user.id)
        .is("logout_time", null);
    }

    await supabase.auth.signOut();

    return NextResponse.json({ message: "Signed out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed", details: String(error) },
      { status: 500 }
    );
  }
}
