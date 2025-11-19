"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";

export default function ModuleListClient({ modules }: { modules: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = modules.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id: string, title: string) => {
    setSearchTerm(title);
    setIsOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("glow-highlight");
    setTimeout(() => el.classList.remove("glow-highlight"), 2000);
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-transparent text-gray-800 font-sans relative">
      {/* ==== LOGO + SEARCH ==== */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-transparent">
        <Link href="/" className="flex items-center">
          <div className="bg-white border-2 border-semcmeBlue rounded-xl shadow-sm px-3 py-2">
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

        {/* SEARCH BOX */}
        <div className="w-[90%] max-w-md sm:w-auto">
          <div className="relative">
            <div className="flex items-center gap-2 bg-white border-2 border-semcmeBlue rounded-xl shadow-sm px-3 py-2">
              <Search className="w-4 h-4 text-semcmeBlue" />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                placeholder="Search modules..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-800"
              />
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="p-1 rounded-md hover:bg-slate-100"
              >
                <ChevronDown
                  className={`w-4 h-4 text-semcmeBlue transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {isOpen && (
              <div className="absolute mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-auto text-sm">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500">
                    No matching modules
                  </div>
                ) : (
                  filtered.map((m) => (
                    <button
                      key={m.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(m.id, m.title)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 text-gray-800"
                    >
                      {m.title}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="w-full text-white py-25 text-center bg-gray-400">
        <h1 className="text-5xl font-bold mb-4">EHR Learning Portal</h1>
        <p className="max-w-2xl mx-auto mb-8 text-md">
          Explore modules designed to improve your knowledge
          <br />
          and application of Electronic Health Records.
        </p>

        <div className="mt-8 flex justify-center gap-8">
          <Link href="/login">
            <button className="landing-signin-btn min-w-[200px] px-8 py-3 rounded-xl text-lg font-semibold shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300">
              Sign In
            </button>
          </Link>

          <Link href="/register/choose">
            <button className="landing-register-btn min-w-[200px] px-8 py-3 rounded-xl text-lg font-semibold shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300">
              Register
            </button>
          </Link>
        </div>
      </section>

      {/* MODULE LIST */}
      <section className="w-full max-w-5xl py-16 px-4 font-sans">
        <h2 className="text-3xl font-semibold mb-10 text-white text-center">
          Explore Available Modules
        </h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {modules.map((mod, i) => (
            <motion.div
              id={mod.id}
              key={mod.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
              className="bg-linear-to-b from-white to-gray-50 shadow-sm rounded-2xl border border-gray-200 p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
            >
              <h3 className="text-2xl font-bold text-semcmeBlue mb-3 tracking-tight">
                {mod.title}
              </h3>

              <p className="text-gray-600 mb-6 max-w-2xl leading-relaxed">
                {mod.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/login?module=${mod.id}`}>
                  <Button variant="outline" className="module-signin-btn">
                    Sign In
                  </Button>
                </Link>

                <Link href={`/register/choose?module=${mod.id}`}>
                  <Button className="module-register-btn">Register</Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
