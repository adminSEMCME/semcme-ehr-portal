//app/login/LoginClient.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module");

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error || !data?.user) {
        alert("Incorrect email or password.");
        setLoading(false);
        return;
      }

      // 2️⃣ WEBSITE ADMIN (metadata-based) FIRST
      const metadataRole = data.user.user_metadata?.role;

      if (metadataRole === "admin") {
        router.push("/admin-dashboard");
        return;
      }

      // 3️⃣ Fetch profile ONCE
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_approved")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        alert("Unable to load user profile.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 4️⃣ Block unapproved Institution Admin
      if (
        profile.role === "Institution Administrator" &&
        !profile.is_approved
      ) {
        alert(
          "Your Institution Administrator account is pending approval. You will receive access once approved.",
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 5️⃣ Start session tracking
      await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: data.user.id,
          page_path: moduleId
            ? `/dashboards?module=${moduleId}`
            : "/dashboards",
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          referrer: document.referrer || null,
        }),
      });

      // 6️⃣ Redirect based on profile role
      if (profile.role === "Institution Administrator") {
        router.push("/institution-admin");
      } else {
        router.push(
          moduleId ? `/dashboards?module=${moduleId}` : "/dashboards",
        );
      }
    } catch (err) {
      alert("Unexpected login error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-transparent font-sans">
      <AppHeader action="back" />

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md w-full max-w-md mt-10 lg:mt-20">
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
            className="border border-gray-300 p-3 rounded-lg w-full"
          />

          <input
            required
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="border border-gray-300 p-3 rounded-lg w-full"
          />

          <div className="text-center -mt-2">
            <a
              href="/forgot-password"
              className="text-sm text-semcmeBlue hover:underline"
            >
              Forgot your password?
            </a>
          </div>

          <Button
            type="submit"
            disabled={loading}
            size="xl"
            className="w-full font-semibold"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-gray-600 mt-6 text-sm text-center">
          Don't have an account?{" "}
          <a
            href={`/register${moduleId ? `?module=${moduleId}` : ""}`}
            className="text-semcmeBlue font-semibold hover:underline"
          >
            Register here
          </a>
        </p>
      </div>
    </main>
  );
}
