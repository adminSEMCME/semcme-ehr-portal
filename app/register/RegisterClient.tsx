"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft } from "lucide-react";

export default function RegisterClient() {
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
    role: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
          data: { ...form, role: form.role },
        },
      });

      if (error) alert("Registration failed: " + error.message);
      else {
        alert(
          "Registration successful! Please verify your email before logging in."
        );
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
      {/* HEADER */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-transparent">
        <Link href="/" className="flex items-center">
          <div className="bg-white border border-semcmeBlue rounded-md shadow-sm px-3 py-2">
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
          className="bg-white border border-semcmeBlue rounded-md shadow-sm px-4 py-2 flex items-center gap-2 text-semcmeBlue font-semibold hover:bg-slate-100 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* CONTENT */}
      <div className="bg-white p-8 md:p-10 rounded-lg shadow-md w-full max-w-2xl mt-5 lg:mt-10 border border-gray-200">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6 text-center">
          EHR Account Registration
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
          {/* ROLE SELECTION */}
          <div>
            <label className="block font-medium mb-1 text-gray-700">
              Select Your Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                name="role"
                value={form.role}
                onChange={handleChange}
                className="appearance-none border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full bg-white"
              >
                <option value="">Select your group</option>
                <option value="Medical Student">Medical Student</option>
                <option value="Resident">Resident</option>
                <option value="Practicing Physician/Faculty">
                  Practicing Physician / Faculty
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                ▼
              </div>
            </div>
          </div>

          {/* EMAIL + PASSWORD */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Create Password <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>
          </div>

          {/* NAME FIELDS */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>
          </div>

          {/* DEGREE + INSTITUTION */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Degree <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="degree"
                value={form.degree}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Institution <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                  className="appearance-none border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full bg-white"
                >
                  <option value="">Select your institution</option>
                  <option value="CMU Med Ed Partners">
                    CMU Med Ed Partners
                  </option>
                  <option value="Corewell Health Dearborn">
                    Corewell Health Dearborn
                  </option>
                  <option value="Corewell Health Farmington Hills">
                    Corewell Health Farmington Hills
                  </option>
                  <option value="Corewell Health Royal Oak">
                    Corewell Health Royal Oak
                  </option>
                  <option value="Detroit Medical Center">
                    Detroit Medical Center
                  </option>
                  <option value="Garden City Hospital">
                    Garden City Hospital
                  </option>
                  <option value="Henry Ford Health">Henry Ford Health</option>
                  <option value="Henry Ford Providence">
                    Henry Ford Providence
                  </option>
                  <option value="Henry Ford Rochester">
                    Henry Ford Rochester
                  </option>
                  <option value="Henry Ford St. John">
                    Henry Ford St. John
                  </option>
                  <option value="McLaren Health Care">
                    McLaren Health Care
                  </option>
                  <option value="Michigan State University CHM">
                    Michigan State University CHM
                  </option>
                  <option value="Oakland University William Beaumont SOM">
                    Oakland University William Beaumont SOM
                  </option>
                  <option value="Trinity Health Ann Arbor">
                    Trinity Health Ann Arbor
                  </option>
                  <option value="Trinity Health Livonia">
                    Trinity Health Livonia
                  </option>
                  <option value="Trinity Health Oakland">
                    Trinity Health Oakland
                  </option>
                  <option value="Wayne State University SOM">
                    Wayne State University SOM
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* PHONE + DEPARTMENT */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="department"
                value={form.department}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>
          </div>

          {/* TITLE + MEDICAL ID */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="title"
                value={form.title}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Medical ID #
              </label>
              <input
                name="medicalId"
                value={form.medicalId}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>
          </div>

          {/* PGY LEVEL + MED SCHOOL YEAR */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block font-medium mb-1 text-gray-700">
                PGY Level
              </label>
              <input
                name="pgyLevel"
                value={form.pgyLevel}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-gray-700">
                Medical School Year <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="medicalSchoolYear"
                value={form.medicalSchoolYear}
                onChange={handleChange}
                className="border border-gray-300 focus:border-semcmeBlue outline-none ring-0 p-3 rounded-md w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-md font-semibold bg-semcmeBlue text-white hover:bg-blue-800 transition"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-gray-600 mt-8 text-sm text-center">
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
