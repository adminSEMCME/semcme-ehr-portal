"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function ChooseRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module");
  const [loading, setLoading] = useState(false);

  const handleRedirect = (path: string) => {
    setLoading(true);
    const redirectUrl = moduleId ? `${path}?module=${moduleId}` : path;
    router.push(redirectUrl);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-transparent font-sans relative">
      <button onClick={() => router.back()} className="back-btn">
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="bg-white p-10 rounded-2xl shadow-md w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6">
          Are you taking this course for CME credit?
        </h1>

        <p className="text-gray-600 mb-10 text-lg">
          Choose the option that applies to you. We&apos;ll tailor your
          registration form accordingly.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button
            onClick={() => handleRedirect("/register/cme")}
            disabled={loading}
            className="choose-cme-btn w-full sm:w-auto px-10 py-4 rounded-xl font-semibold text-lg transition"
          >
            Yes — CME Credit
          </button>

          <button
            onClick={() => handleRedirect("/register/non-cme")}
            disabled={loading}
            className="choose-noncme-btn w-full sm:w-auto px-10 py-4 rounded-xl font-semibold text-lg transition"
          >
            No — Non-CME Credit
          </button>
        </div>

        <p className="text-gray-600 mt-10 text-sm">
          Already have an account?{" "}
          <a
            href={`/login${moduleId ? `?module=${moduleId}` : ""}`}
            className="text-semcmeBlue font-semibold hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
