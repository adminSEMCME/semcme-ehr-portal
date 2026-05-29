import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authUserExists = async (
  admin: SupabaseClient<any, any, any>,
  email: string,
) => {
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    if (
      data.users.some((user) => user.email?.toLowerCase() === email)
    ) {
      return true;
    }

    if (data.users.length < perPage) {
      return false;
    }

    page += 1;
  }
};

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server is not configured for login checks." },
        { status: 500 },
      );
    }

    const { email } = await req.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profileData, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .limit(1);

    if (profileError) {
      console.error("Email profile lookup failed:", profileError);
      return NextResponse.json(
        { error: "Unable to check email." },
        { status: 500 },
      );
    }

    if (profileData?.length) {
      return NextResponse.json({ exists: true });
    }

    const existsInAuth = await authUserExists(admin, normalizedEmail);

    return NextResponse.json({ exists: existsInAuth });
  } catch (err) {
    console.error("Email lookup route error:", err);
    return NextResponse.json(
      { error: "Unable to check email." },
      { status: 500 },
    );
  }
}
