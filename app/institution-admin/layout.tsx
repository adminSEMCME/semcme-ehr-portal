import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

  if (
    profile.role !== "Institution Administrator" ||
    profile.is_approved !== true
  ) {
    redirect("/login");
  }

  return (
    <>
      <SessionWatcher timeoutMinutes={30} />

      <div className="min-h-screen bg-gray-100 font-sans">
        {/* ✅ MATCH ADMIN HEADER */}
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

          <form action="/api/logout" method="post">
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
              Log Out
            </button>
          </form>
        </header>

        {/* ✅ MATCH ADMIN PAGE SPACING */}
        <main className="max-w-7xl mx-auto py-10 px-6">{children}</main>
      </div>
    </>
  );
}
