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
  // -------------------------------------------------------
  // 1️⃣ Get cookies (must be awaited in Next.js 15)
  // -------------------------------------------------------
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

  // -------------------------------------------------------
  // 2️⃣ Get the session securely
  // -------------------------------------------------------
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // -------------------------------------------------------
  // 3️⃣ Ensure user is an admin
  // -------------------------------------------------------
  const userId = session.user.id;

  const { data: adminRecord } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!adminRecord) {
    redirect("/login");
  }

  // -------------------------------------------------------
  // 4️⃣ Return ONLY the inner layout (no html/body!)
  // -------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* HEADER */}
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
          <form action="/logout" method="post">
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
              Log Out
            </button>
          </form>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto py-10 px-6">{children}</main>
    </div>
  );
}
