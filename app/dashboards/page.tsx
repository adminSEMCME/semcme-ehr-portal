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
        })
    )
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
            m.url.replace("/story.html", "/story_content/thumbnail.jpg")
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

  // Refresh progress when tab becomes visible
  useEffect(() => {
    async function refreshProgress() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

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

      setProgress(progressData || []);
      setCertificates(certData || []);
      setAssessments(assessmentData || []);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshProgress();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
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

      window.open(module.url, "_blank");
    } catch (err) {
      console.error("Error starting module:", err);
    }
  };

  /* LOGOUT */
  const handleLogout = async () => {
    await fetch("/api/logout?reason=manual_logout", { method: "POST" });
    router.push("/");
  };

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

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md shadow hover:bg-red-700 transition font-semibold"
        >
          Log Out
        </button>
      </div>

      {/* PAGE TITLE */}
      <h1 className="text-4xl font-bold text-white my-10 text-center">
        EHR Learning Dashboard
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
        {modules.map((module) => {
          const status = getStatus(module.id);
          const progressPercent = getProgress(module.id);
          const cert = getCertificate(module.id);

          const thumbnailPath = module.url.replace(
            "/story.html",
            "/story_content/thumbnail.jpg"
          );

          const objectives = module.objective_description
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
              <div className="bg-semcmeBlue text-white px-4 py-3">
                <div className="text-center">
                  <h2 className="font-semibold leading-tight text-[clamp(1rem,2vw,1.25rem)]">
                    {module.title}
                  </h2>
                </div>

                {/* PROGRESS ROW */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm">{progressPercent}%</span>

                  <div className="flex-1 bg-white/30 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-1 rounded-full transition-all duration-700 ease-out ${
                        status === "completed" ? "bg-green-400" : "bg-white"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
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
              <img
                src={thumbnailPath}
                alt={`${module.title} thumbnail`}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/default-thumbnail.jpg";
                }}
              />

              {/* CONTENT SECTION */}
              <div className="p-6 flex flex-col gap-4 grow">
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
