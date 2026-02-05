//app/dashboards/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

const preloadImages = (urls: string[], timeout = 800) => {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          let done = false;

          const finish = () => {
            if (done) return;
            done = true;
            resolve();
          };

          const timer = setTimeout(finish, timeout);

          img.onload = () => {
            clearTimeout(timer);
            finish();
          };

          img.onerror = () => {
            clearTimeout(timer);
            finish();
          };

          img.src = url;
        }),
    ),
  );
};

interface Module {
  id: string;
  title: string;
  description?: string;
  objective_description?: string;
  url: string;
}

interface ModuleProgress {
  module_id: string;
  status: string;
  progress_percent?: number;
}

interface Certificate {
  module_id: string;
  cert_url: string;
  issued_at: string;
}

const getSkillLevels = (skillLevel?: string): string[] => {
  if (!skillLevel) return [];
  return skillLevel.split(",").map((s) => s.trim().toLowerCase());
};

const sortModulesForGroup = (
  modules: any[],
  group: "all" | "ume" | "gme" | "cme",
) => {
  // 1. Base order
  const sorted = [...modules].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
  );

  // 2. No special rules
  if (group === "all" || group === "ume") return sorted;

  // 3. Find the multi-skill module
  const multiIndex = sorted.findIndex(
    (m) => getSkillLevels(m.skill_level).length > 1,
  );

  if (multiIndex === -1) return sorted;

  const [multi] = sorted.splice(multiIndex, 1);

  // 4. CME → force index 3 (4th position)
  if (group === "cme") {
    sorted.splice(3, 0, multi);
    return sorted;
  }

  // 5. GME → force LAST
  if (group === "gme") {
    sorted.push(multi);
    return sorted;
  }

  return sorted;
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scrollTo = searchParams.get("scrollTo");

  const hasScrolledRef = useRef(false);

  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<ModuleProgress[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<{ module_id: string }[]>([]);

  type GroupFilter = "all" | "ume" | "gme" | "cme";

  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [groupOpen, setGroupOpen] = useState(false);

  /* LOAD DATA */
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: modulesData } = await supabase
          .from("modules")
          .select("*")
          .order("order_index", { ascending: true });

        if (modulesData?.length) {
          const thumbnailUrls = modulesData.map((m) =>
            m.url.replace("/story.html", "/story_content/thumbnail.jpg"),
          );

          await preloadImages(thumbnailUrls);
        }

        const { data: progressData } = await supabase
          .from("module_progress")
          .select("module_id, status, progress_percent")
          .eq("user_id", user.id);

        const { data: certData } = await supabase
          .from("certificates")
          .select("module_id, cert_url, issued_at")
          .eq("user_id", user.id);

        const { data: assessmentData } = await supabase
          .from("post_assessments")
          .select("module_id")
          .eq("user_id", user.id);

        setAssessments(assessmentData || []);
        setModules(modulesData || []);
        setProgress(progressData || []);
        setCertificates(certData || []);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  /* SCROLL AFTER REFETCH (ONCE) */
  useEffect(() => {
    if (!scrollTo) return;
    if (loading) return;
    if (hasScrolledRef.current) return;

    const el = document.getElementById(`module-${scrollTo}`);
    if (!el) return;

    hasScrolledRef.current = true;

    // wait for layout + images to settle
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // clean URL without jumping
        router.replace("/dashboards", { scroll: false });
      });
    });
  }, [scrollTo, loading, router]);

  useEffect(() => {
    async function refetchAll() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      const [
        { data: progressData },
        { data: certData },
        { data: assessmentData },
      ] = await Promise.all([
        supabase
          .from("module_progress")
          .select("module_id, status, progress_percent")
          .eq("user_id", user.id),

        supabase
          .from("certificates")
          .select("module_id, cert_url, issued_at")
          .eq("user_id", user.id),

        supabase
          .from("post_assessments")
          .select("module_id")
          .eq("user_id", user.id),
      ]);

      setProgress(progressData || []);
      setCertificates(certData || []);
      setAssessments(assessmentData || []);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refetchAll();
      }
    }

    window.addEventListener("focus", refetchAll);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refetchAll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /* HELPERS */
  const getStatus = (id: string) =>
    progress.find((p) => p.module_id === id)?.status || "not_started";

  const getProgress = (id: string) =>
    progress.find((p) => p.module_id === id)?.progress_percent ?? 0;

  const getCertificate = (id: string) =>
    certificates.find((c) => c.module_id === id);

  const hasAssessment = (id: string) =>
    assessments.some((a) => a.module_id === id);

  const handleStart = async (module: Module) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return router.push("/login");

      await supabase.from("module_progress").upsert({
        user_id: user.id,
        module_id: module.id,
        status: "in_progress",
        progress_percent: getProgress(module.id),
        date_started: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      });

      // ✅ MOCK-EHR MODULE → open mock-EHR
      if (module.url.includes("mock-ehr")) {
        const payload = {
          sub: user.id,
          email: user.email,
        };

        const token = btoa(JSON.stringify(payload));
        const safeToken = encodeURIComponent(token);

        const mockEhrUrl = `https://mock-ehr.semcme.org/?sso=${safeToken}`;
        window.open(mockEhrUrl, "_blank", "noopener,noreferrer");
        return;
      }

      // ✅ ALL OTHER MODULES → open their Storyline module
      window.open(module.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error starting module:", err);
    }
  };

  /* LOGOUT */
  const handleLogout = async () => {
    await fetch("/api/logout?reason=manual_logout", { method: "POST" });
    router.push("/");
  };

  const filteredModules = modules.filter((m: any) => {
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

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-200">Loading dashboard...</p>
    );
  }

  return (
    <main className="min-h-screen pb-20 bg-transparent flex flex-col items-center font-sans">
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

        <div className="flex items-center gap-3">
          {/* GROUP FILTER */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setGroupOpen((prev) => !prev)}
              className="flex items-center justify-between gap-2 bg-white rounded-md shadow-sm px-4 py-2 text-sm text-semcmeBlue min-w-[220px] h-10"
            >
              <span>Filter Modules: {groupFilter.toUpperCase()}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  groupOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {groupOpen && (
              <div className="absolute right-0 mt-2 w-full bg-white border border-slate-200 rounded-md shadow-lg z-50">
                {(["all", "ume", "gme", "cme"] as GroupFilter[]).map((g) => (
                  <button
                    key={g}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setGroupFilter(g);
                      setGroupOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 rounded-md text-semcmeBlue"
                  >
                    {g.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LOG OUT */}
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md shadow hover:bg-red-700 transition font-semibold h-10"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* PAGE TITLE */}
      <h1 className="text-4xl font-bold text-white mt-6 mb-8 text-center leading-12">
        Improving EHR Use for Better Outcomes: <br />
        User Dashboard
      </h1>

      {/* GRID OF MODULE CARDS */}
      <div
        className="
          w-full max-w-7xl 
          grid 
          grid-cols-1 
          md:grid-cols-2 
          xl:grid-cols-3 
          gap-6 
          px-4
        "
      >
        {sortModulesForGroup(filteredModules, groupFilter).map((module) => {
          const status = getStatus(module.id);
          const progressPercent = getProgress(module.id);
          const cert = getCertificate(module.id);

          const thumbnailPath =
            module.id === "mock-ehr"
              ? "/images/mock-ehr-thumbnail.png"
              : module.url.replace(
                  "/story.html",
                  "/story_content/thumbnail.jpg",
                );

          const objectives: string[] = module.objective_description
            ? module.objective_description.split("\n").filter(Boolean)
            : [];

          return (
            <div
              key={module.id}
              id={`module-${module.id}`}
              className="
                bg-white 
                rounded-lg 
                overflow-hidden 
                shadow-lg 
                border border-gray-200/80
                flex flex-col
              "
            >
              {/* HEADER BAR */}
              <div className="bg-semcmeBlue text-white px-4 pt-4 h-28 flex flex-col">
                {/* TITLE SLOT — fixed height */}
                <div className="h-[3.2rem] flex items-center justify-center text-center px-3">
                  <h2 className="font-semibold leading-tight text-[1.05rem]">
                    {module.title}
                  </h2>
                </div>

                {/* PROGRESS ROW — fixed height & position */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm">{progressPercent}%</span>

                  <div className="flex-1 bg-white/30 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-1 rounded-full transition-all duration-700 ease-out ${
                        status === "completed" ? "bg-green-400" : "bg-white"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <span
                    className={`
                      text-xs px-4 py-1 rounded-full border
                      ${
                        status === "completed"
                          ? "bg-green-100 text-green-700 border-green-400"
                          : status === "in_progress"
                            ? "bg-blue-100 text-blue-700 border-blue-400"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                      }
                    `}
                  >
                    {status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* IMAGE */}
              <div className="w-full h-[220px] overflow-hidden bg-white">
                <img
                  src={thumbnailPath}
                  alt={`${module.title} thumbnail`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallbackApplied) return;

                    img.dataset.fallbackApplied = "true";
                    img.src = "/images/default-thumbnail.jpg";
                  }}
                />
              </div>

              {/* CONTENT SECTION */}
              <div className="p-6 flex flex-col gap-4 grow min-h-[260px]">
                {objectives.length > 0 ? (
                  <ul className="text-gray-700 text-sm leading-relaxed list-disc pl-5 space-y-2">
                    {objectives.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 text-base leading-relaxed">
                    No objectives available for this module.
                  </p>
                )}

                {/* BUTTONS STICK TO BOTTOM */}
                <div className="mt-auto flex flex-col gap-3">
                  <Button
                    onClick={() => handleStart(module)}
                    className="module-start-btn w-full px-6 py-3 rounded-md font-semibold text-base"
                  >
                    {status === "not_started"
                      ? "Start Module"
                      : status === "completed"
                        ? "Review Module"
                        : "Continue Module"}
                  </Button>

                  {status === "completed" && !hasAssessment(module.id) && (
                    <Button
                      onClick={() =>
                        router.push(`/post-assessment?module_id=${module.id}`)
                      }
                      className="w-full px-6 py-3 rounded-md font-semibold text-base bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Post Assessment
                    </Button>
                  )}

                  {status === "completed" &&
                    hasAssessment(module.id) &&
                    cert && (
                      <a
                        href={cert.cert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full px-6 py-3 rounded-md font-semibold text-base bg-green-600 text-white hover:bg-green-700">
                          Download Certificate
                        </Button>
                      </a>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
