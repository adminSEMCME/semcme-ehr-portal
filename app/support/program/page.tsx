"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function ProgramSupportPage() {
  const router = useRouter();

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    setLoading(false);

    // clear form if successful
    if (data.success) {
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 6000);
      setForm({ name: "", email: "", message: "" });
      setFiles([]);
    } else {
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen px-4 pb-20">
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

      {/* FORM CARD */}
      <div className="mt-5 max-w-2xl mx-auto bg-gray-100 border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
        <h1 className="text-2xl font-bold text-semcmeBlue text-center">
          Program Support
        </h1>

        {success && (
          <div className="p-3 bg-green-200 text-black rounded-md text-sm text-center">
            Your message has been sent successfully. Please note that responses
            will arrive from the email address: VHaque@semcme.org
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NAME */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="
                  w-full border border-gray-300 rounded-md px-3 py-2
                  focus:outline-none focus:ring-1 focus:ring-semcmeBlue
                "
            />
          </div>

          {/* EMAIL */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="
                  w-full border border-gray-300 rounded-md px-3 py-2
                  focus:outline-none focus:ring-1 focus:ring-semcmeBlue
                "
            />
          </div>

          {/* MESSAGE */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              rows={8}
              className="
                  w-full border border-gray-300 rounded-md px-3 py-2
                  focus:outline-none focus:ring-1 focus:ring-semcmeBlue
                "
            />
          </div>

          {/* FILE UPLOAD */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Attach Files (optional)
            </label>

            {/* Upload Button */}
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-semcmeBlue hover:bg-gray-50 transition">
                Choose Files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files) return;

                    const newFiles = Array.from(e.target.files);

                    setFiles((prev) => [...prev, ...newFiles]);
                  }}
                />
              </label>

              {files.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="text-sm text-red-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* FILE LIST */}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                  >
                    <span className="truncate max-w-[70%]">{file.name}</span>

                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="
                w-full bg-semcmeBlue text-white py-2 rounded-md 
                font-semibold hover:bg-semcmeBlue/90 transition
              "
          >
            {loading ? "Sending..." : "Send Program Support Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
