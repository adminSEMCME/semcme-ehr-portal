"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() =>
        window.history.length > 1 ? router.back() : router.push("/")
      }
      className="back-btn"
      aria-label="Go back"
      type="button"
    >
      ← Back
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setErrorMsg("Something went wrong sending the reset email.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-transparent font-sans">
      <BackButton />
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6 text-center">
          Forgot your password?
        </h1>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-gray-700">
              If an account exists for{" "}
              <span className="font-semibold">{email}</span>, we’ve sent a
              password reset link. Please check your inbox (and spam).
            </p>
            <p className="text-sm text-gray-500">
              The link will bring you back here to securely set a new password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              type="email"
              name="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-3 rounded-lg w-full"
            />

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="signin-submit-btn w-full py-3 rounded-xl font-semibold transition"
            >
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {!sent && (
          <p className="text-gray-600 mt-6 text-sm text-center">
            Remembered it?{" "}
            <a
              href="/login"
              className="text-semcmeBlue font-semibold hover:underline"
            >
              Sign in
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
