//app/register/RegisterClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft } from "lucide-react";

const ALLOWED_INSTITUTIONS = [
  "CMU Med Ed Partners",
  "Corewell Health Dearborn",
  "Corewell Health Farmington Hills",
  "Corewell Health Royal Oak",
  "Detroit Medical Center",
  "Garden City Hospital",
  "Henry Ford Health",
  "Henry Ford Providence",
  "Henry Ford Rochester",
  "Henry Ford St. John",
  "McLaren Health Care",
  "Michigan State University CHM",
  "Oakland University William Beaumont SOM",
  "Trinity Health Ann Arbor",
  "Trinity Health Livonia",
  "Trinity Health Oakland",
  "Wayne State University SOM",
];

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
    "Institution Administrator": [
      "email",
      "password",
      "firstName",
      "lastName",
      "title",
      "institution",
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
  const [institutions, setInstitutions] = useState<
    { id: string; name: string }[]
  >([]);

  const [customInstitution, setCustomInstitution] = useState("");

  useEffect(() => {
    const fetchInstitutions = async () => {
      const { data, error } = await supabase
        .from("institutions")
        .select("id, name")
        .order("name");

      if (!error && data) {
        const filtered = data.filter((inst) =>
          ALLOWED_INSTITUTIONS.includes(inst.name),
        );

        setInstitutions(filtered);
      }
    };

    fetchInstitutions();
  }, []);

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

      // 🔹 Determine institution_id
      let institutionId = form.institution;

      if (form.institution === "other") {
        if (!customInstitution.trim()) {
          alert("Please enter your institution.");
          setLoading(false);
          return;
        }

        // Insert new institution into table
        const { data: newInst, error: instError } = await supabase
          .from("institutions")
          .insert([{ name: customInstitution.trim() }])
          .select()
          .single();

        if (instError || !newInst) {
          alert("Failed to create new institution.");
          setLoading(false);
          return;
        }

        institutionId = newInst.id;
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
          institution_id: institutionId || null,
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
    <main className="min-h-screen flex flex-col items-center bg-transparent font-sans relative px-4 sm:px-6">
      {/* HEADER */}
      <div className="w-full flex items-center justify-between py-3">
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
            bg-white rounded-md shadow-sm 
            px-4 py-2 flex items-center gap-2 text-semcmeBlue 
            font-semibold hover:bg-slate-100 transition
          "
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* FORM */}
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg w-full max-w-2xl mt-5 mb-20 lg:mt-10 border border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-semcmeBlue mb-6 text-center">
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
              <option value="Institution Administrator">
                Institution Administrator
              </option>
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
                <div>
                  <label className={labelRequired}>
                    Institution <span className={requiredStar}>*</span>
                  </label>

                  <select
                    required
                    name="institution"
                    value={form.institution}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select your institution</option>

                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name}
                      </option>
                    ))}

                    <option value="other">Other</option>
                  </select>

                  {form.institution === "other" && (
                    <input
                      type="text"
                      placeholder="Enter your institution"
                      value={customInstitution}
                      onChange={(e) => setCustomInstitution(e.target.value)}
                      className={`${inputClass} mt-3`}
                      required
                    />
                  )}
                </div>
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
              bg-[#02519c] text-white
              border border-transparent
              shadow-md hover:shadow-lg
              hover:bg-gray-100 hover:text-[#02519c]
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
