//app/institution-admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function InstitutionAdminPage() {
  const router = useRouter();

  const [modules, setModules] = useState<any[]>([]);
  const [reportType, setReportType] = useState("");
  const [individualEmail, setIndividualEmail] = useState("");
  const [moduleScope, setModuleScope] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCatalogue, setShowCatalogue] = useState(false);

  useEffect(() => {
    async function loadModules() {
      const { data } = await supabase
        .from("modules")
        .select("id, title")
        .order("order_index", { ascending: true });

      setModules(data || []);
    }

    loadModules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportType) {
      alert("Please select a report type.");
      return;
    }

    if (reportType === "individual" && !individualEmail.trim()) {
      alert("Please provide the user's email.");
      return;
    }

    if (!moduleScope) {
      alert("Please select a module scope.");
      return;
    }

    if (moduleScope === "specific" && selectedModules.length === 0) {
      alert("Please select at least one module.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data?.user) {
        alert("Authentication error.");
        return;
      }

      const user = data.user;

      const { data: profile } = await supabase
        .from("profiles")
        .select("institution_id")
        .eq("id", user.id)
        .single();

      if (!profile?.institution_id) {
        alert("Unable to determine institution.");
        return;
      }

      const { error } = await supabase
        .from("institution_data_requests")
        .insert({
          requested_by: user.id,
          institution_id: profile.institution_id,
          report_type: reportType,
          individual_user_email:
            reportType === "individual" ? individualEmail : null,
          module_scope: moduleScope,
          selected_modules: moduleScope === "specific" ? selectedModules : null,
          additional_notes: additionalNotes || null,
        });

      if (error) {
        console.error(error);
        alert("Failed to submit request.");
        return;
      }

      alert(
        "Data request submitted successfully. You will receive an email once the report has been fulfilled.",
      );
      setReportType("");
      setIndividualEmail("");
      setModuleScope("");
      setSelectedModules([]);
      setAdditionalNotes("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="min-h-screen pb-20 bg-transparent flex flex-col items-center font-sans px-4">
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
            onClick={() => router.push("/")}
            className="bg-white border-2 border-semcmeBlue rounded-md shadow-sm px-4 py-2 flex items-center gap-2 text-semcmeBlue font-semibold hover:bg-slate-100 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        {/* TITLE */}
        <h1 className="text-3xl font-bold text-white mt-6 mb-8 text-center">
          Institution Administrator Dashboard
        </h1>

        {/* CONTENT CARD */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl p-8 space-y-10">
          {/* INSTRUCTIONS */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-semcmeBlue">
              Institutional Data Requests
            </h2>

            <p className="text-gray-700 text-sm leading-relaxed">
              As an approved Institution Administrator, you may request usage
              and completion reports for your institution.
            </p>

            <p className="text-gray-700 text-sm leading-relaxed">
              Please review the Data Catalogue below to understand what data is
              available before submitting your request.
            </p>

            <p className="text-gray-700 text-sm leading-relaxed">
              Once your request has been processed, you will receive an email
              containing the requested report file.
            </p>
          </section>

          {/* DATA CATALOGUE */}
          <section>
            <h2 className="text-lg font-semibold text-semcmeBlue mb-4">
              Data Catalogue
            </h2>

            <button
              type="button"
              onClick={() => setShowCatalogue(true)}
              className="text-blue-600 underline text-sm font-medium"
            >
              View Data Catalogue (PDF)
            </button>
          </section>

          {/* DATA REQUEST FORM */}
          <section className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-semcmeBlue mb-6">
              Submit Data Request
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* REPORT TYPE */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">
                  Report Type Requested
                </h3>

                <label className="flex items-center gap-3 mb-2">
                  <input
                    type="radio"
                    value="individual"
                    checked={reportType === "individual"}
                    onChange={(e) => setReportType(e.target.value)}
                    required
                  />
                  Individual User Report
                </label>

                {reportType === "individual" && (
                  <input
                    type="email"
                    placeholder="User Email Address"
                    value={individualEmail}
                    onChange={(e) => setIndividualEmail(e.target.value)}
                    className="w-full border rounded-md px-4 py-3 mt-2"
                    required
                  />
                )}

                <label className="flex items-center gap-3 mt-2">
                  <input
                    type="radio"
                    value="institution"
                    checked={reportType === "institution"}
                    onChange={(e) => setReportType(e.target.value)}
                  />
                  Institution Summary Report
                </label>
              </div>

              {/* MODULE SCOPE */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Module Scope</h3>

                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="all"
                    checked={moduleScope === "all"}
                    onChange={(e) => {
                      setModuleScope(e.target.value);
                      setSelectedModules([]);
                    }}
                    required
                  />
                  All Modules
                </label>

                <label className="flex items-center gap-3 mt-2">
                  <input
                    type="radio"
                    value="specific"
                    checked={moduleScope === "specific"}
                    onChange={(e) => setModuleScope(e.target.value)}
                  />
                  Specific Modules
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 mt-3">
                  {modules.map((mod) => (
                    <label
                      key={mod.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
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
              </div>

              {/* ADDITIONAL NOTES */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">
                  Additional Notes (Optional)
                </h3>

                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Provide any additional context..."
                  className="w-full border rounded-md px-4 py-3"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold bg-semcmeBlue text-white hover:bg-blue-800 transition"
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </section>
        </div>
        {showCatalogue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white w-[95%] max-w-6xl h-[85%] rounded-lg shadow-2xl flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-semcmeBlue">
                  Data Catalogue
                </h3>
                <button
                  onClick={() => setShowCatalogue(false)}
                  className="text-gray-500 hover:text-black text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src="/pdfs/data-catalogue.pdf"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="mt-16 border-t bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          {/* Contact Support */}
          <div>
            <h3 className="text-white font-semibold mb-3">Contact Support</h3>

            <p className="font-normal mb-2">Technical Support</p>
            <p>Shane Ross</p>
            <p className="mb-3">shanectr3@gmail.com</p>
          </div>

          {/* Organization */}
          <div>
            <h3 className="text-white font-semibold mb-3">Organization</h3>
            <p>Southeast Michigan Center for Medical Education</p>
            <p>EHR Data Request Portal</p>

            <p className="font-normal mt-4">Phone</p>
            <p>(866) - 2SEMCME</p>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white font-semibold mb-3">Help</h3>
            <p>
              If you experience issues with requesting data for your institution, please contact technical support.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-700 text-center text-xs py-4">
          © {new Date().getFullYear()} SEMCME
        </div>
      </footer>
    </>
  );
}
