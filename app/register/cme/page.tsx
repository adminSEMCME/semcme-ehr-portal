"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CmeRegistration() {
  const router = useRouter();
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
    medicalSchoolYear: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { role: "CME", ...form },
      },
    });

    if (error) {
      (window as any).showToast("Registration Failed", error.message);
    } else {
      (window as any).showToast(
        "Registration Successful 🎉",
        "Please check your email to verify your account before logging in."
      );

      // Small delay before redirect
      setTimeout(() => router.push("/login"), 3000);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6 text-center">
          CME Registration
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
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              name="lastName"
              placeholder="Last Name"
              required
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="degree"
              placeholder="Degree"
              required
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              name="institution"
              placeholder="Institution"
              required
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="phone"
              placeholder="Phone Number"
              required
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
            <input
              name="department"
              placeholder="Department"
              required
              onChange={handleChange}
              className="border p-3 rounded-lg"
            />
          </div>

          <input
            name="title"
            placeholder="Title"
            required
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
          />

          <input
            name="medicalSchoolYear"
            placeholder="Medical School Year"
            required
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
          />

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
            href="/login"
            className="text-semcmeBlue font-semibold hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
