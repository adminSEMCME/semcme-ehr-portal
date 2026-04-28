// app/forgot-password/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft } from "lucide-react";
import AppHeader from "@/components/AppHeader";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) setErrorMsg(error.message);
      else setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-transparent font-sans">
      <AppHeader action="back" />

      {/* CONTENT */}
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md w-full max-w-md mt-10">
        <h1 className="text-2xl font-bold text-semcmeBlue mb-6 text-center">
          Forgot your password?
        </h1>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-gray-700">
              If an account exists for{" "}
              <span className="font-semibold">{email}</span>, a password reset
              link has been sent.
            </p>
            <p className="text-sm text-gray-500">
              Check your inbox and spam folder.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full"
            />

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="signin-submit-btn w-full py-3 rounded-md font-semibold transition"
            >
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {!sent && (
          <p className="text-gray-600 mt-6 text-sm text-center">
            Remembered your password?{" "}
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
