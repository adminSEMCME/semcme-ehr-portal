// app/admin-dashboard/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import AppHeader from "@/components/AppHeader";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
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

  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) redirect("/login");

  const role = userData.user.user_metadata?.role;
  if (role !== "admin") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <AppHeader action="logout" />

      <main className="max-w-7xl mx-auto py-10 px-6">{children}</main>
    </div>
  );
}
