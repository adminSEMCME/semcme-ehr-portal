//app/register/RegisterClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  hasAtLeastTwoWords,
  normalizeInstitutionName,
} from "@/lib/institutionName";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  "Southeast Michigan Center for Medical Education",
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
  confirmPassword: string;
  firstName: string;
  lastName: string;
  degree: string;
  institution: string;
  department: string;
  title: string;
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
      "institution",
      "medicalSchoolYear",
    ],

    Resident: [
      "email",
      "password",
      "firstName",
      "lastName",
      "degree",
      "medicalId", // optional
      "institution",
      "department",
      "pgyLevel",
    ],

    "Practicing Physician/Faculty": [
      "email",
      "password",
      "firstName",
      "lastName",
      "degree",
      "title",
      "medicalId", // required
      "institution",
      "department",
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
    ],

    "Institution Administrator": [
      "email",
      "password",
      "firstName",
      "lastName",
      "title",
      "institution",
    ],

    Other: [
      "profession",
      "email",
      "password",
      "firstName",
      "lastName",
      "degree",
      "institution",
      "department",
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
    confirmPassword: "",
    firstName: "",
    lastName: "",
    degree: "",
    institution: "",
    department: "",
    title: "",
    medicalId: "",
    pgyLevel: "",
    medicalSchoolYear: "",
  };

  const [form, setForm] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<
    { id: string; name: string }[]
  >([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

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
      setFieldErrors({});
      return;
    }

    setForm({ ...form, [name]: value });
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleCustomInstitutionChange = (value: string) => {
    setCustomInstitution(value);
    setFieldErrors((prev) => {
      if (!prev.customInstitution) return prev;
      const next = { ...prev };
      delete next.customInstitution;
      return next;
    });
  };

  const normalizeCustomInstitution = () => {
    setCustomInstitution(normalizeInstitutionName(customInstitution));
  };

  const renderFieldError = (field: string) =>
    fieldErrors[field] ? (
      <p className="mt-2 text-sm text-red-700">{fieldErrors[field]}</p>
    ) : null;

  /* ============================================================
     VALIDATION BEFORE SUBMIT
     ============================================================ */
  const validateRequiredFields = () => {
    const errors: Record<string, string> = {};

    if (!form.role) {
      errors.role = "Please select your group.";
    }

    if (!form.firstName.trim()) {
      errors.firstName = "First name is required.";
    }

    if (!form.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    if (form.institution === "other") {
      if (!customInstitution.trim()) {
        errors.customInstitution = "Please enter your institution.";
      } else if (!hasAtLeastTwoWords(customInstitution)) {
        errors.customInstitution =
          "Please enter the full institution name using at least two words.";
      }
    }

    const required = roleFieldMap[form.role] || [];

    for (const field of required) {
      if (field === "medicalId" && form.role === "Resident") continue;

      const value = form[field];
      if (!value || value.trim() === "") {
        errors[field] = "This field is required.";
      }
    }

    if (showField("password")) {
      if (!form.confirmPassword.trim()) {
        errors.confirmPassword = "Please retype your password.";
      } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return false;
    }

    return true;
  };

  /* ============================================================
     SUBMIT
     ============================================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setModalMessage(null);

    if (!validateRequiredFields()) return;

    setFieldErrors({});
    setLoading(true);

    try {
      const payload = {
        email: form.email,
        password: form.password,
        first_name: formatName(form.firstName),
        last_name: formatName(form.lastName),
        role: form.role,
        degree: form.degree || null,
        department: form.department || null,
        title: form.title || null,
        profession: form.profession || null,
        medical_id: form.medicalId || null,
        pgy_level: form.pgyLevel || null,
        medical_school_year: form.medicalSchoolYear || null,
        institution_id: form.institution !== "other" ? form.institution : null,
        custom_institution:
          form.institution === "other"
            ? normalizeInstitutionName(customInstitution)
            : null,
        moduleId,
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          result.error ||
          (response.status === 400
            ? "Missing required fields."
            : response.status === 409
              ? "Email already registered."
              : response.status === 500
                ? "Server error, please try again."
                : "Registration failed.");

        setModalMessage({ text: message, type: "error" });
        setDialogOpen(true);
        return;
      }

      setModalMessage({
        text: "Registration successful! Please verify your email.",
        type: "success",
      });
      setDialogOpen(true);
    } catch (error) {
      console.error("Registration network error:", error);
      setModalMessage({
        text: "Network error. Please try again.",
        type: "error",
      });
      setDialogOpen(true);
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
      <AppHeader action="back" />

      {/* FORM */}
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg w-full max-w-2xl mt-5 mb-20 lg:mt-10 border border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-semcmeBlue mb-3 text-center">
          EHR Account Registration
        </h1>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open && modalMessage?.type === "success") {
              router.push(`/login${moduleId ? `?module=${moduleId}` : ""}`);
            }
            setDialogOpen(open);
          }}
        >
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>
                {modalMessage?.type === "success"
                  ? "Registration complete"
                  : "Registration error"}
              </DialogTitle>
              <DialogDescription>{modalMessage?.text}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                  if (modalMessage?.type === "success") {
                    router.push(
                      `/login${moduleId ? `?module=${moduleId}` : ""}`,
                    );
                  }
                }}
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div>
          <p className="text-gray-800 text-center text-xs mb-6">
            Please note that selecting{" "}
            <strong>Practicing Physician/Faculty</strong> or{" "}
            <strong>Nursing</strong> will grant access to{" "}
            <strong>Continuing Education (CE) credits</strong> after completion
            of modules. All other groups will <strong>NOT</strong> have access
            to (CE) credits.
          </p>

          <p className="text-gray-800 text-center text-xs mb-6">
            Only select <strong>Institution Administrator</strong> if you are an
            administrator at your institution. This role requires{" "}
            <strong>additional approval</strong> and is intended for designated{" "}
            <strong>institutional representatives</strong>. The{" "}
            <strong>Institution Administrator</strong> role does{" "}
            <strong>NOT</strong> have access to modules. Please select a
            different role to access learning modules.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 text-gray-800"
        >
          {/* ROLE */}
          <div>
            <label className={labelRequired}>
              Select Your Group <span className={requiredStar}>*</span>
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={`${inputClass} ${fieldErrors.role ? "border-red-500" : ""}`}
            >
              <option value="">Select your group</option>
              <option value="Medical Student">Medical Student</option>
              <option value="Resident">Resident / Fellow</option>
              <option value="Practicing Physician/Faculty">
                Practicing Physician / Faculty
              </option>
              <option value="Nursing">Nursing</option>
              <option value="Institution Administrator">
                Institution Administrator (Designated Representatives Only)
              </option>
              <option value="Other">Other (Please specify)</option>
            </select>
            {renderFieldError("role")}
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
              error={fieldErrors.profession}
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
              error={fieldErrors.email}
            />
          )}

          {showField("password") && (
            <div className="grid md:grid-cols-2 gap-4">
              <FieldInput
                label="Password"
                required
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                inputClass={inputClass}
                error={fieldErrors.password}
                trailingButton={
                  <Button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-semcmeBlue"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                }
              />
              <FieldInput
                label="Retype Password"
                required
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                inputClass={inputClass}
                error={fieldErrors.confirmPassword}
                trailingButton={
                  <Button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-semcmeBlue"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </Button>
                }
              />
            </div>
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
                  error={fieldErrors.firstName}
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
                  error={fieldErrors.lastName}
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
                    error={fieldErrors.degree}
                  />
                  <FieldInput
                    label="Title"
                    required
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    inputClass={inputClass}
                    error={fieldErrors.title}
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
                      error={fieldErrors.degree}
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
                      error={fieldErrors.title}
                    />
                  )}
                </>
              )}
            </>
          )}

          {showField("medicalId") && (
            <FieldInput
              label="NPI #"
              required={form.role === "Practicing Physician/Faculty"}
              name="medicalId"
              value={form.medicalId}
              onChange={handleChange}
              inputClass={inputClass}
              error={fieldErrors.medicalId}
            />
          )}

          {(showField("institution") || showField("department")) && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* INSTITUTION */}
              {showField("institution") && (
                <div>
                  <label className={labelRequired}>
                    Institution <span className={requiredStar}>*</span>
                  </label>

                  <select
                    name="institution"
                    value={form.institution}
                    onChange={handleChange}
                    className={`${inputClass} ${fieldErrors.institution ? "border-red-500" : ""}`}
                  >
                    <option value="">Select your institution</option>

                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name}
                      </option>
                    ))}

                    <option value="other">Other</option>
                  </select>
                  {renderFieldError("institution")}

                  {form.institution === "other" && (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Enter full institution name (2+ words)"
                        value={customInstitution}
                        onChange={(e) =>
                          handleCustomInstitutionChange(e.target.value)
                        }
                        onBlur={normalizeCustomInstitution}
                        className={`${inputClass} ${fieldErrors.customInstitution ? "border-red-500" : ""}`}
                      />
                      {renderFieldError("customInstitution")}
                    </div>
                  )}
                </div>
              )}

              {showField("department") && (
                <FieldInput
                  label={
                    form.role === "Medical Student"
                      ? "Department"
                      : "Department / Specialty"
                  }
                  required
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  inputClass={inputClass}
                  error={fieldErrors.department}
                />
              )}
            </div>
          )}

          {showField("pgyLevel") && (
            <FieldInput
              label="PGY Level"
              required
              name="pgyLevel"
              value={form.pgyLevel}
              onChange={handleChange}
              inputClass={inputClass}
              error={fieldErrors.pgyLevel}
            />
          )}

          {showField("medicalSchoolYear") && (
            <div>
              <label className={labelRequired}>
                Medical School Year <span className={requiredStar}>*</span>
              </label>
              <select
                name="medicalSchoolYear"
                value={form.medicalSchoolYear}
                onChange={handleChange}
                className={`${inputClass} ${fieldErrors.medicalSchoolYear ? "border-red-500" : ""}`}
              >
                <option value="">Select year</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
                <option value="M3">M3</option>
                <option value="M4">M4</option>
                <option value="M5+">M5+</option>
              </select>
              {renderFieldError("medicalSchoolYear")}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            size="xl"
            className="w-full mt-4 font-semibold shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>

        <p className="text-gray-600 mt-8 text-sm text-center">
          Already have an account?{" "}
          <a
            href={`/login${moduleId ? `?module=${moduleId}` : ""}`}
            className="text-semcmeBlue font-semibold hover:underline"
            title="Go to sign in page"
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
  error,
  trailingButton,
}: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className={trailingButton ? "relative" : undefined}>
        <input
          required={required}
          name={name}
          value={value}
          type={type}
          onChange={onChange}
          className={`${inputClass} ${trailingButton ? "pr-10" : ""} ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
        {trailingButton}
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
