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
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) redirect("/login");

  // 🔎 Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_approved")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const role = profile.role;

  // 🚫 Block unapproved accounts entirely
  if (profile.is_approved !== true) {
    redirect("/login");
  }

  // 🚫 Institution Admins should never access user dashboard
  if (role === "Institution Administrator") {
    redirect("/institution-admin");
  }

  // 🚫 Website admin should not access user dashboard
  if (role === "admin") {
    redirect("/admin-dashboard");
  }

  // 🚫 If no role at all, block
  if (!role) {
    redirect("/login");
  }

  return (
    <>
      <SessionWatcher timeoutMinutes={30} />
      {children}
    </>
  );
}
