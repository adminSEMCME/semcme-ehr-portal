import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = {
    sub: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = Buffer.from(JSON.stringify(payload)).toString("base64");

  const redirectUrl = `https://mock-ehr.semcme.org/?sso=${token}`;

  return NextResponse.redirect(redirectUrl);
}
