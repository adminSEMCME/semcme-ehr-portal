"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NonCmeRegistration() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      if (error) {
        alert("Registration Failed: " + error.message);
      } else {
        alert(
          "Registration successful! Please check your email to verify your account before logging in."
        );

        // Redirect to login after short delay
        setTimeout(() => {
          router.push(`/login${moduleId ? `?module=${moduleId}` : ""}`);
        }, 2500);
      }
    } catch (err) {
      console.error("Error during registration:", err);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6 text-center">
          Non-CME Registration
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email + Password */}
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

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="firstName"
              placeholder="First Name"
              required
              value={form.firstName}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              name="lastName"
              placeholder="Last Name"
              required
              value={form.lastName}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="degree"
              placeholder="Degree"
              required
              value={form.degree}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              name="institution"
              placeholder="Institution"
              required
              value={form.institution}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="phone"
              placeholder="Phone Number"
              required
              value={form.phone}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              name="department"
              placeholder="Department"
              required
              value={form.department}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="title"
              placeholder="Title"
              required
              value={form.title}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              name="medicalId"
              placeholder="Medical ID #"
              required
              value={form.medicalId}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="pgyLevel"
              placeholder="PGY Level"
              required
              value={form.pgyLevel}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              name="medicalSchoolYear"
              placeholder="Medical School Year"
              required
              value={form.medicalSchoolYear}
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-semcmeBlue text-white font-semibold hover:bg-[#034f8c] transition"
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
