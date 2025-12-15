"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft } from "lucide-react";

// ----------------------- TYPES -----------------------
type FormState = {
  role: string;
  profession: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  degree: string;
  institution: string;
  department: string;
  title: string;
  phone: string;
  medicalId: string;
  pgyLevel: string;
  medicalSchoolYear: string;
};

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module");

  // ----------------------- FIELD GROUPS -----------------------
  const roleFieldMap: Record<string, (keyof FormState)[]> = {
    "Medical Student": [
      "email",
      "password",
      "firstName",
      "lastName",
      "degree",
      "title",
      "medicalId",
      "institution",
      "department",
      "phone",
      "medicalSchoolYear",
    ],
    Resident: [
      "email",
      "password",
      "firstName",
      "lastName",
      "degree",
      "title",
      "medicalId",
      "institution",
      "department",
      "phone",
      "pgyLevel",
    ],
    "Practicing Physician/Faculty": [
      "email",
      "password",
      "firstName",
      "lastName",
      "degree",
      "title",
      "medicalId",
      "institution",
      "department",
      "phone",
    ],
    Nursing: [
      "email",
      "password",
      "firstName",
      "lastName",
      "degree",
      "title",
      "institution",
      "department",
      "phone",
    ],
    Other: [
      "profession",
      "email",
      "password",
      "firstName",
      "lastName",
      "degree",
      "title",
      "institution",
      "department",
      "phone",
    ],
  };

  // ----------------------- FORM DEFAULT -----------------------
  const defaultForm: FormState = {
    role: "",
    profession: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    degree: "",
    institution: "",
    department: "",
    title: "",
    phone: "",
    medicalId: "",
    pgyLevel: "",
    medicalSchoolYear: "",
  };

  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);

  // ----------------------- HANDLE CHANGE -----------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "role") {
      const allowed = roleFieldMap[value] || [];

      const resetForm: FormState = { ...defaultForm, role: value };

      allowed.forEach((field) => {
        resetForm[field] = form[field] || "";
      });

      setForm(resetForm);
      return;
    }

    setForm({ ...form, [name]: value });
  };

  // ----------------------- SUBMIT -----------------------
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
          data: {
            role: form.role,
            email: form.email,
            first_name: form.firstName,
            last_name: form.lastName,
            degree: form.degree,
            institution: form.institution,
            department: form.department,
            title: form.title,
            phone: form.phone,
            profession: form.profession || null,
            medical_id: form.medicalId || null,
            pgy_level: form.pgyLevel || null,
            medical_school_year: form.medicalSchoolYear || null,
          },
        },
      });

      if (error) {
        alert("Registration failed: " + error.message);
      } else {
        alert("Registration successful! Please verify your email.");
        setTimeout(
          () => router.push(`/login${moduleId ? `?module=${moduleId}` : ""}`),
          1500
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const showField = (field: keyof FormState) =>
    roleFieldMap[form.role]?.includes(field);

  // ----------------------- STYLES -----------------------
  const inputClass =
    "w-full p-3 rounded-lg bg-gray-50 border border-gray-300 " +
    "focus:bg-white focus:border-[#02519c] focus:border-2 " +
    "focus:ring-0 outline-none transition-all duration-100";

  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  // ----------------------- RENDER -----------------------
  return (
    <main className="min-h-screen flex flex-col items-center font-sans">
      {/* HEADER */}
      <div className="w-full flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <div className="bg-white border border-semcmeBlue rounded-md shadow-sm px-3 py-2">
            <div className="relative w-[170px] h-[45px]">
              <Image
                src="/logos/semcme_logo.jpg"
                alt="SEMCME Logo"
                fill
                className="object-contain rounded-md"
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

      {/* FORM */}
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg w-full max-w-2xl mt-5 mb-20 border border-gray-200">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6 text-center">
          EHR Account Registration
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 text-gray-800">
          {/* ROLE */}
          <div>
            <label className={labelClass}>
              Select Your Group <span className="text-red-500">*</span>
            </label>
            <select
              required
              name="role"
              value={form.role}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select your group</option>
              <option value="Medical Student">Medical Student</option>
              <option value="Resident">Resident / Fellow</option>
              <option value="Practicing Physician/Faculty">
                Practicing Physician / Faculty
              </option>
              <option value="Nursing">Nursing</option>
              <option value="Other">Other (Please specify)</option>
            </select>
          </div>

          {/* PROFESSION */}
          {showField("profession") && (
            <div>
              <label className={labelClass}>Your Profession *</label>
              <input
                name="profession"
                value={form.profession}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          )}

          {/* EMAIL */}
          {showField("email") && (
            <div>
              <label className={labelClass}>Institutional Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          )}

          {/* PASSWORD */}
          {showField("password") && (
            <div>
              <label className={labelClass}>Password *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          )}

          {/* NAME FIELDS */}
          {(showField("firstName") || showField("lastName")) && (
            <div className="grid md:grid-cols-2 gap-4">
              {showField("firstName") && (
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              )}
              {showField("lastName") && (
                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}

          {/* DEGREE + TITLE */}
          {(showField("degree") || showField("title")) && (
            <div className="grid md:grid-cols-2 gap-4">
              {showField("degree") && (
                <div>
                  <label className={labelClass}>Degree *</label>
                  <input
                    name="degree"
                    value={form.degree}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              )}
              {showField("title") && (
                <div>
                  <label className={labelClass}>Title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}

          {/* NPI */}
          {showField("medicalId") && (
            <div>
              <label className={labelClass}>NPI #</label>
              <input
                name="medicalId"
                value={form.medicalId}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          )}

          {/* INSTITUTION + DEPARTMENT */}
          {(showField("institution") || showField("department")) && (
            <div className="grid md:grid-cols-2 gap-4">
              {showField("institution") && (
                <div>
                  <label className={labelClass}>Institution *</label>
                  <input
                    name="institution"
                    value={form.institution}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              )}
              {showField("department") && (
                <div>
                  <label className={labelClass}>Department *</label>
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}

          {/* PHONE */}
          {showField("phone") && (
            <div>
              <label className={labelClass}>Phone Number *</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          )}

          {/* PGY */}
          {showField("pgyLevel") && (
            <div>
              <label className={labelClass}>PGY Level *</label>
              <input
                name="pgyLevel"
                value={form.pgyLevel}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          )}

          {/* MEDICAL SCHOOL YEAR */}
          {showField("medicalSchoolYear") && (
            <div>
              <label className={labelClass}>Medical School Year *</label>
              <select
                name="medicalSchoolYear"
                value={form.medicalSchoolYear}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Select year</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
                <option value="M3">M3</option>
                <option value="M4">M4</option>
              </select>
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="
            register-submit-btn 
            w-full py-3 mt-4 rounded-lg font-semibold 
            shadow-md hover:shadow-lg 
            active:scale-[0.98]
            transition-all duration-200
          "
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
