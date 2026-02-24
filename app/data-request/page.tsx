"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DataRequestPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [institutionScope, setInstitutionScope] = useState("");
  const [reportType, setReportType] = useState("");
  const [moduleScope, setModuleScope] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const roles = [
    "Medical Student",
    "Resident/Fellow",
    "Practicing Physician/Faculty",
    "Nursing",
    "Other",
  ];

  useEffect(() => {
    async function loadData() {
      const { data: moduleData } = await supabase
        .from("modules")
        .select("id, title")
        .order("order_index", { ascending: true });

      setModules(moduleData || []);
    }

    loadData();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-b from-semcmeBlue to-blue-800 px-4 py-12">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-semcmeBlue mb-8 text-center">
          Data Request Form
        </h1>

        <p className="text-gray-600 text-sm text-center mb-10">
          Please complete the form below to request a data report. Reports will
          be generated based on the options selected.
        </p>

        <form
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();

            if (moduleScope === "specific" && selectedModules.length === 0) {
              alert("Please select at least one module.");
              return;
            }

            // API call will go here next
          }}
        >
          {/* REQUESTOR INFORMATION */}
          <section>
            <h2 className="text-lg font-semibold text-semcmeBlue mb-4">
              Requestor Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                required
                className="w-full border rounded-md px-4 py-3"
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                className="w-full border rounded-md px-4 py-3"
              />

              <input
                type="text"
                name="institution"
                placeholder="Institution"
                required
                className="w-full border rounded-md px-4 py-3"
              />

              <input
                type="text"
                name="roleTitle"
                placeholder="Role / Title"
                className="w-full border rounded-md px-4 py-3"
              />
            </div>
          </section>

          {/* REPORT TYPE */}
          <section>
            <h2 className="text-lg font-semibold text-semcmeBlue mb-4">
              Report Type Requested
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="reportType"
                  value="individual"
                  onChange={(e) => setReportType(e.target.value)}
                  required
                />
                Individual User Report
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="reportType"
                  value="module"
                  onChange={(e) => setReportType(e.target.value)}
                />
                Module Completion Report
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="reportType"
                  value="institution"
                  onChange={(e) => setReportType(e.target.value)}
                />
                Institution Summary Report
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="reportType"
                  value="custom"
                  onChange={(e) => setReportType(e.target.value)}
                />
                Custom Report (describe below)
              </label>

              <textarea
                name="customDescription"
                placeholder="If Custom Report, please describe your request"
                required={reportType === "custom"}
                disabled={reportType !== "custom"}
                className="w-full border rounded-md px-4 py-3 mt-3"
                rows={4}
              />
            </div>
          </section>

          {/* SCOPE SECTION */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-semcmeBlue">
              Scope of Report
            </h2>

            {/* Institution Scope */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800">
                A. Institution Scope
              </h3>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="institutionScope"
                  value="all"
                  onChange={(e) => setInstitutionScope(e.target.value)}
                  required
                />
                All Institutions
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="institutionScope"
                  value="specific"
                  onChange={(e) => setInstitutionScope(e.target.value)}
                />
                Specific Institution
              </label>

              <input
                type="text"
                name="institutionName"
                placeholder="Institution Name"
                required={institutionScope === "specific"}
                disabled={institutionScope !== "specific"}
                className="w-full border rounded-md px-4 py-3"
              />
            </div>

            {/* Module Scope */}
            <div className="space-y-3">
              <h3 className="text-semcmeBlue font-semibold">Module Scope</h3>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="moduleScope"
                  value="all"
                  onChange={(e) => {
                    setModuleScope(e.target.value);
                    setSelectedModules([]);
                  }}
                  required
                />
                All Modules
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="moduleScope"
                  value="specific"
                  onChange={(e) => setModuleScope(e.target.value)}
                />
                Specific Module(s)
              </label>

              {moduleScope === "specific" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto border rounded-md p-3">
                  {modules.map((mod) => (
                    <label
                      key={mod.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="selectedModules"
                        value={mod.id}
                        checked={selectedModules.includes(mod.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModules([...selectedModules, mod.id]);
                          } else {
                            setSelectedModules(
                              selectedModules.filter((id) => id !== mod.id),
                            );
                          }
                        }}
                      />
                      {mod.title}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Role Scope */}
            <div className="space-y-3">
              <h3 className="text-semcmeBlue font-semibold">
                User Role Filter (Optional)
              </h3>

              <label className="flex items-center gap-3">
                <input type="radio" name="roleScope" value="all" />
                All Roles
              </label>

              <label className="flex items-center gap-3">
                <input type="radio" name="roleScope" value="specific" />
                Specific Role(s)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-3">
                {roles.map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="selectedRoles" value={role} />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-3">
              <h3 className="text-semcmeBlue font-semibold">
                Additional Notes (Optional)
              </h3>

              <textarea
                name="additionalNotes"
                placeholder="Provide any additional context or clarification regarding your request..."
                className="w-full border rounded-md px-4 py-3"
                rows={3}
              />
            </div>
          </section>

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold bg-semcmeBlue text-white shadow-md hover:bg-blue-800 transition"
          >
            Submit Request
          </button>
        </form>
      </div>
    </main>
  );
}
