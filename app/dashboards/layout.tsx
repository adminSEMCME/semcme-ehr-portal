// app/dashboards/layout.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import SessionWatcher from "@/components/SessionWatcher";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: any) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // ❌ server component cannot modify cookies
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) redirect("/login");

  const role = user.user_metadata?.role;
  if (role !== "user") redirect("/login");

  return (
    <>
      <SessionWatcher timeoutMinutes={30} />
      {children}
    </>
  );
}
