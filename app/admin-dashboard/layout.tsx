// app/admin-dashboard/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import Image from "next/image";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Get cookies for Supabase SSR
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

  // 🔒 1️⃣ AUTHENTICATED CHECK — USE getUser() TO REMOVE WARNING
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    redirect("/login");
  }

  const user = userData.user;

  // 🔒 2️⃣ ROLE CHECK (admin only)
  const role = user.user_metadata?.role;

  if (role !== "admin") {
    redirect("/login");
  }

  // 3️⃣ RENDER ADMIN LAYOUT
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="w-full bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="relative w-[170px] h-[45px]">
            <Image
              src="/logos/semcme_logo.jpg"
              alt="SEMCME Logo"
              fill
              className="object-contain"
            />
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <form action="/api/logout" method="post">
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
              Log Out
            </button>
          </form>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-6">{children}</main>
    </div>
  );
}
