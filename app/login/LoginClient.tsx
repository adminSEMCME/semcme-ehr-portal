//app/login/LoginClient.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module");

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const emailExists = async (email: string) => {
    const response = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return Boolean(result.exists);
  };

  const getLoginErrorMessage = async (error: any) => {
    const errorMessage = error?.message?.toLowerCase() || "";

    if (
      errorMessage.includes("not confirmed") ||
      errorMessage.includes("email not verified") ||
      errorMessage.includes("verify your email")
    ) {
      return "Your email is not verified. Please check your inbox.";
    }

    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many")
    ) {
      return "Too many sign-in attempts. Please wait a few minutes and try again.";
    }

    if (
      errorMessage.includes("user not found") ||
      errorMessage.includes("no user") ||
      errorMessage.includes("invalid login credentials")
    ) {
      const exists = await emailExists(form.email);

      if (exists === true) {
        return "The password you entered is incorrect.";
      }

      if (exists === false) {
        return "This email is not associated with an account.";
      }
    }

    return "Incorrect email or password.";
  };

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
        const message = await getLoginErrorMessage(error);
        setDialogMessage(message);
        setDialogOpen(true);
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
        setDialogMessage(
          "Unable to load your account profile. Please try again.",
        );
        setDialogOpen(true);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 4️⃣ Block unapproved Institution Admin
      if (
        profile.role === "Institution Administrator" &&
        !profile.is_approved
      ) {
        setDialogMessage(
          "Your Institution Administrator account is pending approval. You will receive access once approved.",
        );
        setDialogOpen(true);
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
      console.error("Login error:", err);
      setDialogMessage("Unexpected login error. Please try again.");
      setDialogOpen(true);
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Sign in error</DialogTitle>
              <DialogDescription>{dialogMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={() => setDialogOpen(false)}>
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              title="Reset your password"
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
            title="Go to registration page"
          >
            Register here
          </a>
        </p>
      </div>
    </main>
  );
}
