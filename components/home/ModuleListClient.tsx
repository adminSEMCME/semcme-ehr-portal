//components/home/ModuleListClient.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";

type GroupFilter = "all" | "ume" | "gme" | "cme";

export default function ModuleListClient({ modules }: { modules: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // GROUP FILTER STATE
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [groupOpen, setGroupOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  // HERO CAROUSEL STATE
  const images = [
    "/images/hero1.png",
    "/images/hero2.png",
    "/images/hero3.png",
  ];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [paused, nextSlide]);

  // CLOSE FILTER DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setGroupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // GROUP FILTER
  const groupFilteredModules = modules.filter((m) => {
    const level = (m.skill_level || "").toLowerCase();
    if (groupFilter === "all") return true;
    if (groupFilter === "ume") return level === "novice" || level === "all";
    if (groupFilter === "cme")
      return level === "intermediate" || level === "all";
    if (groupFilter === "gme") return level === "advanced" || level === "all";
    return true;
  });

  // SEARCH FILTER
  const filtered = groupFilteredModules.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()),
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

  const sectionTitle =
    groupFilter === "all"
      ? "Explore Available Modules"
      : `Explore Available ${groupFilter.toUpperCase()} Modules`;

  return (
    <main className="flex flex-col items-center min-h-screen bg-transparent text-gray-800 font-sans relative">
      {/* HEADER */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-transparent z-50 relative">
        <Link href="/" className="flex items-center logo-container">
          <div className="bg-white border-2 border-semcmeBlue rounded-md shadow-sm px-3 py-2 logo-container">
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

        {/* FILTER + SEARCH */}
        <div className="flex items-center gap-3">
          {/* GROUP FILTER */}
          <div ref={groupRef} className="relative">
            <button
              type="button"
              onClick={() => setGroupOpen((prev) => !prev)}
              className="flex items-center justify-between gap-2 bg-white rounded-md shadow-sm px-4 py-3 h-11 min-w-[260px] text-sm text-semcmeBlue"
            >
              <span className="font-medium">
                Filter Modules: {groupFilter.toUpperCase()}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {groupOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 w-full overflow-hidden">
                {(["all", "ume", "gme", "cme"] as GroupFilter[]).map((g) => (
                  <button
                    key={g}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setGroupFilter(g);
                      setGroupOpen(false);
                      setSearchTerm("");
                    }}
                    className="block w-full text-left px-4 py-3 text-sm text-semcmeBlue hover:bg-slate-100 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {g.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SEARCH BAR */}
          <div className="search-bar w-[90%] max-w-md sm:w-auto">
            <div className="relative">
              <div className="flex items-center gap-2 bg-white border-2 border-semcmeBlue rounded-md shadow-sm px-3 py-3 h-11">
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
                  className="flex-1 bg-transparent text-sm text-semcmeBlue placeholder:text-semcmeBlue"
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
                <div className="absolute mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-auto text-sm z-50">
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
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 text-semcmeBlue"
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
      </div>

      {/* HERO SECTION */}
      <section
        className="w-full h-[500px] relative overflow-hidden z-0"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="absolute inset-0">
          {images.map((img, i) => (
            <Image
              key={i}
              src={img}
              alt="Hero background"
              fill
              priority
              className={`absolute inset-0 object-cover object-center transition-opacity duration-1000 ease-in-out ${
                i === index ? "opacity-100" : "opacity-0"
              } scale-110`}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-black/25 z-0" />

        <div className="absolute inset-0 flex flex-col justify-center items-center px-6 z-10">
          <div
            className="
              max-w-xl w-full
              rounded-2xl
              shadow-xl
              text-center
              p-10
              bg-slate-400/90
              backdrop-blur-sm
            "
          >
            <h1 className="text-4xl font-bold mb-6 text-white drop-shadow-lg">
              Improving EHR Use For Better Outcomes
            </h1>

            <p className="mb-8 text-md text-white drop-shadow-lg leading-relaxed">
              Explore modules designed to improve your knowledge
              <br />
              and application of Electronic Health Records.
            </p>

            <div className="mt-4 flex gap-6 justify-center">
              <Link href="/login">
                <button className="landing-signin-btn min-w-[180px] px-8 py-3 rounded-md text-lg font-semibold shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300">
                  Sign In
                </button>
              </Link>

              <Link href="/register">
                <button className="landing-register-btn min-w-[180px] px-8 py-3 rounded-md text-lg font-semibold shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300">
                  Register
                </button>
              </Link>
            </div>

            <p className="mt-8 text-sm font-semibold text-white drop-shadow-md max-w-md mx-auto">
              You only need to register once. After registering, please use the
              Sign In button above to access all modules, or use the View Module
              buttons below to sign in and be directed to a specific module.
            </p>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className="
            absolute 
            left-8 top-1/2 -translate-y-1/2
            bg-white/90 hover:bg-white
            z-20 
            h-12 w-12
            rounded-full
            flex items-center justify-center
            shadow-lg
            transition
          "
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-semcmeBlue"
            aria-hidden
          >
            {/* visually centered left arrow */}
            <path
              d="M14 6l-6 6 6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(-0.75, 0)"
            />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="
            absolute 
            right-8 top-1/2 -translate-y-1/2
            bg-white/90 hover:bg-white
            z-20 
            h-12 w-12
            rounded-full
            flex items-center justify-center
            shadow-lg
            transition
          "
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-semcmeBlue">
            <path
              d="M10 6l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(0.4, 0)"
            />
          </svg>
        </button>

        <div className="absolute bottom-4 w-full flex justify-center gap-2 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-3 w-3 rounded-full transition-all ${
                i === index ? "bg-white scale-110" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* MODULE GRID */}
      <section className="w-full py-14 px-6">
        <h2 className="text-3xl font-semibold mb-7 text-white text-center">
          {sectionTitle}
        </h2>

        <p className="mb-7 text-sm text-white text-center max-w-xl mx-auto">
          Use the "Filter Modules" drop-down above to view learning modules
          tailored to specific education levels.
        </p>

        <div className="w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 w-full"
          >
            {filtered.map((mod, i) => {
              return (
                <motion.div
                  id={mod.id}
                  key={mod.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: i * 0.05 },
                  }}
                  className="bg-white shadow-sm rounded-md border border-gray-200 px-3 py-7 flex flex-col text-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-90"
                >
                  <h3 className="text-lg font-bold text-semcmeBlue mt-1 px-5">
                    {mod.title}
                  </h3>

                  <p className="text-black text-sm grow flex items-center leading-relaxed px-5">
                    {mod.description}
                  </p>

                  <Link href={`/login?module=${mod.id}`}>
                    <Button
                      variant="outline"
                      className="module-signin-btn ml-5 px-3 py-1 mb-2 text-xs"
                    >
                      View Module
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
