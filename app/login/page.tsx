"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module");

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      const user = data?.user;
      if (!user) return;

      // Persist Supabase session for SSR routes
      await supabase.auth.getSession();

      // Optionally log session (kept from your original logic)
      try {
        await supabase.from("user_sessions").insert([
          {
            user_id: user.id,
            ip_address: window.location.hostname,
            user_agent: navigator.userAgent,
            logout_reason: null,
          },
        ]);
      } catch (sessionError) {
        console.error("Failed to log session:", sessionError);
      }

      // Store role in localStorage (unchanged from your setup)
      if (user.user_metadata?.role) {
        localStorage.setItem("user_role", user.user_metadata.role);
      }

      // ✅ Redirect to dashboards, preserving module ID if present
      const redirectUrl = moduleId
        ? `/dashboards?module=${moduleId}`
        : "/dashboards";

      router.push(redirectUrl);
    } catch (err) {
      console.error("Unexpected login error:", err);
      alert("An unexpected error occurred while signing in.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-transparent font-sans">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6 text-center">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
          />
          <input
            required
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-semcmeBlue text-white font-semibold hover:bg-[#034f8c] transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-gray-600 mt-6 text-sm text-center">
          Don&apos;t have an account?{" "}
          <a
            href={`/register/choose${moduleId ? `?module=${moduleId}` : ""}`}
            className="text-semcmeBlue font-semibold hover:underline"
          >
            Register here
          </a>
        </p>
      </div>
    </main>
  );
}
