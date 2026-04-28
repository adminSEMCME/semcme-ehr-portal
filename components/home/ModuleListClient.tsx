//components/home/ModuleListClient.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import Footer from "../Footer";
import AppHeader from "../AppHeader";

type GroupFilter = "all" | "ume" | "gme" | "cme";

const getSkillLevels = (skillLevel?: string): string[] => {
  if (!skillLevel) return [];
  return skillLevel.split(",").map((s) => s.trim().toLowerCase());
};

// HERO CAROUSEL STATE
const HERO_IMAGES = [
  "/images/hero2.jpg",
  "/images/hero3.jpg",
  "/images/hero4.jpg",
  "/images/hero5.jpg",
  "/images/hero6.jpg",
  "/images/hero7.jpg",
];

const sortModulesForGroup = (
  modules: any[],
  group: "all" | "ume" | "gme" | "cme",
) => {
  const baseSorted = [...modules].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
  );

  if (group === "all") return baseSorted;

  // ---------- UME ORDER ----------
  if (group === "ume") {
    const umeOrder = [
      "Introduction to EHR Educational Series",
      "Electronic Health Records: An Introduction",
      "The Note: Documentation in an EHR",
      "Introduction to Coding and Billing: ICD-10, CPT, E/M Codes",
      "Order Entry and Order Sets",
      "Documenting Social Determinants of Health",
    ];

    return baseSorted.sort((a, b) => {
      const aIndex = umeOrder.indexOf(a.title);
      const bIndex = umeOrder.indexOf(b.title);

      if (aIndex === -1 && bIndex === -1)
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }

  // ---------- GME ORDER ----------
  if (group === "gme") {
    const gmeOrder = [
      "Introduction to EHR Educational Series",
      "Effective Use of EHRs",
      "Mock EHR Clinical Encounter",
      "High Yield Notes",
      "Coding and Billing: Office Workflow",
      "Medical Procedure and Visit Coding",
      "Diagnosis Coding and Billing: ICD-10 and How to Build a Diagnosis",
      "Documenting Social Determinants of Health",
    ];

    return baseSorted.sort((a, b) => {
      const aIndex = gmeOrder.indexOf(a.title);
      const bIndex = gmeOrder.indexOf(b.title);

      if (aIndex === -1 && bIndex === -1)
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }

  // ---------- CME ORDER ----------
  if (group === "cme") {
    const cmeOrder = [
      "Introduction to EHR Educational Series",
      "Improving Efficiency and Effectiveness in the Use of EHRs",
      "Documenting Social Determinants of Health",
      "Improving Quality Metrics for Transitions of Care: From Hospital to PCP",
      "Improving Quality Metrics for Transitions of Care: From Emergency Room to Primary Care",
      "Documenting Evidence Based Management of Obesity and Performance Measures",
      "Documenting Evidence Based Management of Diabetes and Performance Measures",
    ];

    return baseSorted.sort((a, b) => {
      const aIndex = cmeOrder.indexOf(a.title);
      const bIndex = cmeOrder.indexOf(b.title);

      if (aIndex === -1 && bIndex === -1)
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }

  return baseSorted;
};

export default function ModuleListClient({ modules }: { modules: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // GROUP FILTER STATE
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [groupOpen, setGroupOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const [guidesOpen, setGuidesOpen] = useState(false);
  const guidesRef = useRef<HTMLDivElement>(null);

  const images = HERO_IMAGES;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const FADE_DURATION = 2500; // must match CSS transition
  const SLIDE_DELAY = 5000; // how long image stays visible after fade

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % HERO_IMAGES.length);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev === 0 ? HERO_IMAGES.length - 1 : prev - 1));
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const runCarousel = () => {
      timeout = setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        runCarousel();
      }, SLIDE_DELAY + FADE_DURATION);
    };

    // shorter first delay so the first slide doesn't linger
    timeout = setTimeout(() => {
      setIndex((prev) => (prev + 1) % HERO_IMAGES.length);
      runCarousel();
    }, SLIDE_DELAY);

    return () => clearTimeout(timeout);
  }, []);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (guidesRef.current && !guidesRef.current.contains(e.target as Node)) {
        setGuidesOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // GROUP FILTER
  const groupFilteredModules = modules.filter((m) => {
    const levels = getSkillLevels(m.skill_level);

    if (groupFilter === "all") return true;
    if (groupFilter === "ume")
      return levels.includes("novice") || levels.includes("all");
    if (groupFilter === "gme")
      return levels.includes("intermediate") || levels.includes("all");
    if (groupFilter === "cme")
      return levels.includes("advanced") || levels.includes("all");

    return true;
  });

  // SEARCH FILTER
  const orderedModules = sortModulesForGroup(groupFilteredModules, groupFilter);

  const filtered = orderedModules.filter((m) =>
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
    <>
      <main className="flex flex-col items-center min-h-screen bg-transparent text-gray-800 font-sans relative">
        <AppHeader variant="home" />

        {/* HERO SECTION */}
        <section className="w-full h-[600px] relative overflow-hidden z-0">
          <div className="absolute inset-0">
            {images.map((img, i) => (
              <Image
                key={i}
                src={img}
                alt="Hero background"
                fill
                priority
                className={`absolute inset-0 object-cover object-center transition-opacity duration-2000 ease-in-out ${
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
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6 text-white drop-shadow-lg leading-tight">
                Improving EHR Use For Better Outcomes
              </h1>

              <p className="mb-8 text-md text-white drop-shadow-lg leading-relaxed">
                Explore modules designed to improve your knowledge
                <br />
                and application of Electronic Health Records.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center w-full">
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
                You only need to register once. After registering, please use
                the Sign In button above to access all modules, or use the View
                Module buttons below to sign in and be directed to a specific
                module.
              </p>
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="
            hidden sm:flex
            absolute 
            left-8 top-1/2 -translate-y-1/2
            bg-white/90 hover:bg-white
            z-20 
            h-12 w-12
            rounded-full
            items-center justify-center
            shadow-lg
            transition
          "
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-semcmeBlue"
              aria-hidden
            >
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
            hidden sm:flex
            absolute 
            right-8 top-1/2 -translate-y-1/2
            bg-white/90 hover:bg-white
            z-20 
            h-12 w-12
            rounded-full
            items-center justify-center
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

          <div className="absolute bottom-1 sm:bottom-4 w-full flex justify-center gap-2 z-20">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition-all ${
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

          <p className="mb-6 text-sm text-white text-center max-w-xl mx-auto">
            Use the filter or search below to find learning modules tailored to
            your education level or specific topics.
          </p>

          {/* FILTER + SEARCH ABOVE MODULES */}
          <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-4 mb-8 px-4">
            {/* GROUP FILTER */}
            <div
              ref={groupRef}
              className="relative w-full max-w-md lg:max-w-sm"
            >
              <button
                type="button"
                onClick={() => setGroupOpen((prev) => !prev)}
                className="flex items-center justify-between gap-2 bg-white rounded-md shadow-sm px-4 py-3 h-11 w-full text-sm text-semcmeBlue"
              >
                <span className="font-medium">
                  Filter Modules: {groupFilter.toUpperCase()}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {groupOpen && (
                <div className="absolute mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {(["all", "ume", "gme", "cme"] as GroupFilter[]).map((g) => (
                    <button
                      key={g}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setGroupFilter(g);
                        setGroupOpen(false);
                        setSearchTerm("");
                      }}
                      className="block w-full text-left px-4 py-3 text-sm text-semcmeBlue hover:bg-slate-100"
                    >
                      {g.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SEARCH BAR */}
            <div className="w-full max-w-md lg:max-w-sm">
              <div className="relative">
                <div className="flex items-center gap-2 bg-white rounded-md shadow-sm px-3 py-3 h-11">
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
      <Footer />
    </>
  );
}
