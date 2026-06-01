import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const confirmUrl = new URL("/auth/confirm", url.origin);

  url.searchParams.forEach((value, key) => {
    confirmUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(confirmUrl);
}
