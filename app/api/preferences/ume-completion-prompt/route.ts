import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(request: Request) {
  try {
    const { hidden } = await request.json();

    if (typeof hidden !== "boolean") {
      return NextResponse.json(
        { error: "The hidden preference must be a boolean." },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { error } = await admin
      .from("profiles")
      .update({ hide_ume_completion_prompt: hidden })
      .eq("id", user.id);

    if (error) {
      console.error("Unable to save UME completion prompt preference:", error);
      return NextResponse.json(
        { error: "Unable to save preference." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UME completion prompt preference update failed:", error);
    return NextResponse.json(
      { error: "Unable to save preference." },
      { status: 500 },
    );
  }
}
