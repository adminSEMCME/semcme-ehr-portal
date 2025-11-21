// lib/supabaseClient.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: true,
    },
    auth: {
      persistSession: true, // Keep session on page refresh
      autoRefreshToken: true, // Refresh token automatically
      detectSessionInUrl: true, // Handle redirects after login
      // 👇 This isolates each tab by storing session per tab instead of localStorage
      storage:
        typeof window !== "undefined" ? window.sessionStorage : undefined,
    },
  }
);
