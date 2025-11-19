"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft } from "lucide-react";

export default function NonCmeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module");

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    degree: "",
    institution: "",
    phone: "",
    department: "",
    title: "",
    medicalId: "",
    pgyLevel: "",
    medicalSchoolYear: "",
  });

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login${
            moduleId ? `?module=${moduleId}` : ""
          }`,
          data: { role: "NON_CME", ...form },
        },
      });

      if (error) alert("Registration failed: " + error.message);
      else {
        alert("Registration successful! Verify your email before logging in.");
        setTimeout(
          () => router.push(`/login${moduleId ? `?module=${moduleId}` : ""}`),
          2500
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-transparent font-sans relative">
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

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md w-full max-w-2xl mt-10">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6 text-center">
          Non-CME Registration
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              required
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="border p-3 rounded-lg w-full"
            />
            <input
              required
              name="password"
              type="password"
              placeholder="Create Password"
              value={form.password}
              onChange={handleChange}
              className="border p-3 rounded-lg w-full"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              required
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              required
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              required
              name="degree"
              placeholder="Degree"
              value={form.degree}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              required
              name="institution"
              placeholder="Institution"
              value={form.institution}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              required
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              required
              name="department"
              placeholder="Department"
              value={form.department}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              required
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              required
              name="medicalId"
              placeholder="Medical ID #"
              value={form.medicalId}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              required
              name="pgyLevel"
              placeholder="PGY Level"
              value={form.pgyLevel}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              required
              name="medicalSchoolYear"
              placeholder="Medical School Year"
              value={form.medicalSchoolYear}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="register-submit-btn w-full py-3 rounded-xl font-semibold transition"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-gray-600 mt-6 text-sm text-center">
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
