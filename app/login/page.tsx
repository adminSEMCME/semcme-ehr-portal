"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) return alert(error.message);

      const user = data?.user;
      if (!user) return;

      await supabase.auth.getSession();

      await supabase.from("user_sessions").insert([
        {
          user_id: user.id,
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent,
        },
      ]);

      if (user.user_metadata?.role)
        localStorage.setItem("user_role", user.user_metadata.role);

      const redirectUrl = moduleId
        ? `/dashboards?module=${moduleId}`
        : "/dashboards";

      router.push(redirectUrl);
    } catch (err) {
      alert("Unexpected login error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-transparent font-sans">
      {/* HEADER */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-transparent">
        <Link href="/" className="flex items-center">
          <div className="bg-white border-2 border-semcmeBlue rounded-xl shadow-sm px-3 py-2">
            <div className="relative w-[170px] h-[45px]">
              <Image
                src="/logos/semcme_logo.jpg"
                alt="SEMCME Logo"
                fill
                className="object-contain rounded-md"
                priority
              />
            </div>
          </div>
        </Link>

        <button
          onClick={() =>
            window.history.length > 1 ? router.back() : router.push("/")
          }
          className="bg-white border-2 border-semcmeBlue rounded-xl shadow-sm px-4 py-2 flex items-center gap-2 text-semcmeBlue font-semibold hover:bg-slate-100 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* CONTENT */}
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md w-full max-w-md mt-10">
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

          <div className="text-center -mt-2">
            <a
              href="/forgot-password"
              className="text-sm text-semcmeBlue hover:underline"
            >
              Forgot your password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="signin-submit-btn w-full py-3 rounded-xl font-semibold transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-gray-600 mt-6 text-sm text-center">
          Don't have an account?{" "}
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
