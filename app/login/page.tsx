// app/login/page.tsx (SERVER)
import { cookies } from "next/headers";
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default async function LoginPageWrapper() {
  const cookieStore = await cookies();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginClient />
    </Suspense>
  );
}
