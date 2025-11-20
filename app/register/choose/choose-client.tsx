"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ChooseClient() {
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
    <main className="min-h-screen flex flex-col items-center bg-transparent font-sans relative">
      {/* HEADER */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-transparent">
        <Link href="/" className="flex items-center">
          <div className="bg-white border-2 border-semcmeBlue rounded-md shadow-sm px-3 py-2">
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
          className="bg-white border-2 border-semcmeBlue rounded-md shadow-sm px-4 py-2 flex items-center gap-2 text-semcmeBlue font-semibold hover:bg-slate-100 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* CONTENT */}
      <div className="bg-white p-10 rounded-2xl shadow-md w-full max-w-2xl text-center mt-10">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6">
          Are you taking this course for CME credit?
        </h1>

        <p className="text-gray-600 mb-10 text-lg">
          Choose the option that applies to you. We’ll tailor your registration
          form accordingly.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button
            onClick={() => handleRedirect("/register/cme")}
            disabled={loading}
            className="choose-cme-btn w-full sm:w-auto px-10 py-4 rounded-md font-semibold text-lg transition"
          >
            Yes — CME Credit
          </button>

          <button
            onClick={() => handleRedirect("/register/non-cme")}
            disabled={loading}
            className="choose-noncme-btn w-full sm:w-auto px-10 py-4 rounded-md font-semibold text-lg transition"
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
