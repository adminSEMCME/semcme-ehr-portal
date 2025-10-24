// lib/protectRoute.ts
import { redirect } from "next/navigation";
import { createClient } from "./supabaseServer";

export async function protectRoute() {
  const supabase = await createClient(); // <-- await because createClient is async
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return data.user;
}
