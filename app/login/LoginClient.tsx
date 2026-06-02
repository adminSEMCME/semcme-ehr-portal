//app/login/LoginClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [dialogTitle, setDialogTitle] = useState("Sign in error");
  const [dialogMessage, setDialogMessage] = useState("");

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Show route-level login errors when another page sends one here.
  useEffect(() => {
    const error = searchParams.get("error");

    if (error) {
      setDialogTitle("Sign in error");
      setDialogMessage(error);
      setDialogOpen(true);
    }
  }, [searchParams]);

  // Looks up account status so login errors can be specific.
  const getEmailStatus = async (email: string) => {
    const response = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return {
      exists: Boolean(result.exists),
      emailConfirmed:
        typeof result.emailConfirmed === "boolean"
          ? result.emailConfirmed
          : null,
    };
  };

  // Converts Supabase auth failures into user-facing messages.
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
      const status = await getEmailStatus(form.email);

      if (status?.emailConfirmed === false) {
        return "Your email is not verified. Please check your inbox for the verification link.";
      }

      if (status?.exists === true) {
        return "The password you entered is incorrect.";
      }

      if (status?.exists === false) {
        return "This email is not associated with an account.";
      }
    }

    return "Incorrect email or password.";
  };

  // Attempts sign in, starts tracking, then sends the user to the right portal.
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          moduleId,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          result.authMessage
            ? await getLoginErrorMessage({
                message: result.authMessage || result.error,
              })
            : result.error || "Unexpected login error. Please try again.";

        setDialogMessage(message);
        setDialogTitle("Sign in error");
        setDialogOpen(true);
        setLoading(false);
        return;
      }

      await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: result.user_id,
          page_path: result.redirectTo || "/dashboards",
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          referrer: document.referrer || null,
        }),
      });

      router.push(result.redirectTo || "/dashboards");
    } catch (err) {
      console.error("Login error:", err);
      setDialogTitle("Sign in error");
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
              <DialogTitle>{dialogTitle}</DialogTitle>
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
