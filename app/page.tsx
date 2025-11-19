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
        get(name: string) {
          return cookieStore.get(name)?.value ?? "";
        },
      },
    }
  );

  // SERVER fetch — no client delay
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, description, url, order_index")
    .order("order_index", { ascending: true });

  return <ModuleListClient modules={modules || []} />;
}
