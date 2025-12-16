// app/page.tsx (SERVER COMPONENT)
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import ModuleListClient from "@/components/home/ModuleListClient";

export default async function HomePage() {
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
          // ❌ Do NOT modify cookies in a server component
        },
      },
    }
  );

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, description, url, order_index, skill_level")
    .order("order_index", { ascending: true });

  return <ModuleListClient modules={modules || []} />;
}
