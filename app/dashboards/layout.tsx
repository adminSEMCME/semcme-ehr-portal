// app/dashboards/layout.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import SessionWatcher from "@/components/SessionWatcher";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? "";
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login");

  const role = session.user.user_metadata?.role;

  if (role !== "user") redirect("/login");

  return (
    <>
      <SessionWatcher timeoutMinutes={30} />
      {children}
    </>
  );
}
