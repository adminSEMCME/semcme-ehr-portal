//app/register/RegisterClient.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft } from "lucide-react";

/* ============================================================
   TYPE FIX — ALLOWS form[field] WITHOUT TS ERRORS
   ============================================================ */
type FormData = {
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
} & { [key: string]: string }; // index signature

const formatName = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("-"),
    )
    .join(" ");
};

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module");

  /* ============================================================
     FIELD GROUPS
     ============================================================ */
  const roleFieldMap: Record<string, string[]> = {
    "Medical Student": [
      "email",
      "password",
      "firstName",
      "lastName",
      "title",
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

  /* ============================================================
     STATE
     ============================================================ */
  const defaultForm: FormData = {
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

  const [form, setForm] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(false);

  /* ============================================================
     HANDLE CHANGE
     ============================================================ */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // When role changes → reset fields dynamically
    if (name === "role") {
      const allowed = roleFieldMap[value] || [];
      const updated: FormData = { ...defaultForm, role: value };

      allowed.forEach((f) => {
        updated[f] = form[f] || "";
      });

      setForm(updated);
      return;
    }

    setForm({ ...form, [name]: value });
  };

  /* ============================================================
     VALIDATION BEFORE SUBMIT
     ============================================================ */
  const validateRequiredFields = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      alert("First and last name are required.");
      return false;
    }

    const required = roleFieldMap[form.role] || [];

    for (const field of required) {
      if (!form[field] || form[field].trim() === "") {
        alert("Please fill in all required fields.");
        return false;
      }
    }

    return true;
  };

  /* ============================================================
     SUBMIT
     ============================================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRequiredFields()) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `https://ehr.portal.semcme.org/login${
            moduleId ? `?module=${moduleId}` : ""
          }`,
        },
      });

      if (error || !data?.user) {
        alert("Registration failed: " + error?.message);
        return;
      }

      // 🔐 Create profile via server route
      const profileRes = await fetch("/api/register/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: data.user.id,
          external_id: data.user.id,
          role: form.role,
          email: form.email,
          first_name: formatName(form.firstName),
          last_name: formatName(form.lastName),
          degree: form.degree || null,
          institution: form.institution || null,
          department: form.department || null,
          title: form.title || null,
          phone: form.phone || null,
          profession: form.profession || null,
          medical_id: form.medicalId || null,
          pgy_level: form.pgyLevel || null,
          medical_school_year: form.medicalSchoolYear || null,
        }),
      });

      if (!profileRes.ok) {
        const err = await profileRes.json().catch(() => ({}));
        alert(
          "Registration failed while creating profile." +
            (err?.error ? ` ${err.error}` : ""),
        );
        return;
      }

      alert("Registration successful! Please verify your email.");
      setTimeout(
        () => router.push(`/login${moduleId ? `?module=${moduleId}` : ""}`),
        2000,
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     RENDER HELPERS
     ============================================================ */
  const showField = (field: string) => roleFieldMap[form.role]?.includes(field);

  const inputClass = `
    w-full p-3 rounded-lg
    border border-gray-300 
    bg-gray-50 
    focus:bg-white 
    focus:border-2 
    focus:border-semcmeBlue 
    focus:outline-none 
    focus:ring-0
    transition-all duration-200
  `;

  const labelRequired = `
    block text-sm font-semibold text-gray-700 mb-1 
  `;

  const requiredStar = `text-red-500`;

  /* ============================================================
     UI
     ============================================================ */
  return (
    <main className="min-h-screen flex flex-col items-center bg-transparent font-sans relative">
      {/* HEADER */}
      <div className="w-full flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <div className="bg-white rounded-md shadow-sm px-3 py-2">
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
          className="
            bg-white border border-semcmeBlue rounded-md shadow-sm 
            px-4 py-2 flex items-center gap-2 text-semcmeBlue 
            font-semibold hover:bg-slate-100 transition
          "
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* FORM */}
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg w-full max-w-2xl mt-5 mb-20 lg:mt-10 border border-gray-200">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6 text-center">
          EHR Account Registration
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 text-gray-800">
          {/* ROLE */}
          <div>
            <label className={labelRequired}>
              Select Your Group <span className={requiredStar}>*</span>
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

          {/* RENDER FIELDS */}
          {showField("profession") && (
            <FieldInput
              label="Your Profession"
              required
              name="profession"
              value={form.profession}
              onChange={handleChange}
              inputClass={inputClass}
            />
          )}

          {showField("email") && (
            <FieldInput
              label="Institutional Email"
              required
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              inputClass={inputClass}
            />
          )}

          {showField("password") && (
            <FieldInput
              label="Password"
              required
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              inputClass={inputClass}
            />
          )}

          {/* NAME FIELDS */}
          {(showField("firstName") || showField("lastName")) && (
            <div className="grid md:grid-cols-2 gap-4">
              {showField("firstName") && (
                <FieldInput
                  label="First Name"
                  required
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  inputClass={inputClass}
                />
              )}
              {showField("lastName") && (
                <FieldInput
                  label="Last Name"
                  required
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  inputClass={inputClass}
                />
              )}
            </div>
          )}

          {/* DEGREE + TITLE */}
          {(showField("degree") || showField("title")) && (
            <>
              {/* If both exist → 2-column grid */}
              {showField("degree") && showField("title") ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <FieldInput
                    label="Degree"
                    required
                    name="degree"
                    value={form.degree}
                    onChange={handleChange}
                    inputClass={inputClass}
                  />
                  <FieldInput
                    label="Title"
                    required
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    inputClass={inputClass}
                  />
                </div>
              ) : (
                /* If only one exists → normal single-row field */
                <>
                  {showField("degree") && (
                    <FieldInput
                      label="Degree"
                      required
                      name="degree"
                      value={form.degree}
                      onChange={handleChange}
                      inputClass={inputClass}
                    />
                  )}
                  {showField("title") && (
                    <FieldInput
                      label="Title"
                      required
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      inputClass={inputClass}
                    />
                  )}
                </>
              )}
            </>
          )}

          {showField("medicalId") && (
            <FieldInput
              label="NPI #"
              required={false}
              name="medicalId"
              value={form.medicalId}
              onChange={handleChange}
              inputClass={inputClass}
            />
          )}

          {(showField("institution") || showField("department")) && (
            <div className="grid md:grid-cols-2 gap-4">
              {showField("institution") && (
                <FieldInput
                  label="Institution"
                  required
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                  inputClass={inputClass}
                />
              )}
              {showField("department") && (
                <FieldInput
                  label="Department"
                  required
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  inputClass={inputClass}
                />
              )}
            </div>
          )}

          {showField("phone") && (
            <FieldInput
              label="Phone Number"
              required
              name="phone"
              value={form.phone}
              onChange={handleChange}
              inputClass={inputClass}
            />
          )}

          {showField("pgyLevel") && (
            <FieldInput
              label="PGY Level"
              required
              name="pgyLevel"
              value={form.pgyLevel}
              onChange={handleChange}
              inputClass={inputClass}
            />
          )}

          {showField("medicalSchoolYear") && (
            <div>
              <label className={labelRequired}>
                Medical School Year <span className={requiredStar}>*</span>
              </label>
              <select
                required
                name="medicalSchoolYear"
                value={form.medicalSchoolYear}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select year</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
                <option value="M3">M3</option>
                <option value="M4">M4</option>
                <option value="M5">M5</option>
                <option value="M6">M6</option>
                <option value="M7">M7</option>
                <option value="M8">M8</option>
              </select>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 mt-4 rounded-lg font-semibold 
              bg-semcmeBlue text-white 
              shadow-md hover:shadow-lg 
              hover:bg-white hover:text-semcmeBlue hover:border-semcmeBlue border-2 
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

/* ============================================================
   SMALL REUSABLE FIELD COMPONENT
   ============================================================ */
function FieldInput({
  label,
  required = true,
  name,
  value,
  type = "text",
  onChange,
  inputClass,
}: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        required={required}
        name={name}
        value={value}
        type={type}
        onChange={onChange}
        className={inputClass}
      />
    </div>
  );
}
