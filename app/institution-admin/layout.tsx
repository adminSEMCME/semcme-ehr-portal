//app/institution-admin/layout.tsx

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import SessionWatcher from "@/components/SessionWatcher";

export default async function InstitutionAdminLayout({
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
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_approved")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Only approved Institution Administrators allowed
  if (
    profile.role !== "Institution Administrator" ||
    profile.is_approved !== true
  ) {
    redirect("/login");
  }

  return (
    <>
      <SessionWatcher timeoutMinutes={30} />
      {children}
    </>
  );
}
