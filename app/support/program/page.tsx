"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";

export default function ProgramSupportPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/support/program", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 6000);
      setForm({ name: "", email: "", message: "" });
      setFiles([]);
    } else {
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <AppHeader action="back" />

      {/* FORM CARD */}
      <div className="mt-8 max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-semcmeBlue text-center">
          Program Support Form
        </h1>
        <div className="w-16 h-1 bg-[#02519c] mx-auto mt-2 mb-6 rounded-full" />

        <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-900 text-center">
          Submitting this form will send your request directly to a SEMCME team
          member. This will begin email correspondance so we can assist you with
          your question or issue.
        </div>

        {success && (
          <div className="p-3 mb-4 bg-green-100 border border-green-300 text-green-800 rounded-md text-sm text-center">
            Your message has been sent successfully. Responses will come from
            VHaque@semcme.org
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NAME */}
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-semcmeBlue"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-semcmeBlue"
            />
          </div>

          {/* MESSAGE */}
          <div>
            <label className="text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              rows={7}
              className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-semcmeBlue resize-none"
            />
          </div>

          {/* FILES */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Attach Files (optional)
            </label>

            <div className="flex items-center gap-3 mt-2">
              <label className="cursor-pointer bg-[#02519c] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-900 transition">
                Upload Files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files) return;
                    setFiles((prev) => [
                      ...prev,
                      ...Array.from(e.target.files!),
                    ]);
                  }}
                />
              </label>

              {files.length > 0 && (
                <Button
                  type="button"
                  onClick={() => setFiles([])}
                  variant="link"
                  className="h-auto p-0 text-sm text-red-600"
                >
                  Clear
                </Button>
              )}
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-gray-50 border rounded-md px-3 py-2 text-sm"
                  >
                    <span className="truncate">{file.name}</span>
                    <Button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      variant="link"
                      className="h-auto p-0 text-xs text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            size="xl"
            className="w-full font-semibold shadow"
          >
            {loading ? "Sending..." : "Send Program Support Request"}
          </Button>
        </form>
      </div>
    </div>
  );
}
