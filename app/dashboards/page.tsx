"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description?: string;
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
  const targetModule = searchParams.get("module");

  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<ModuleProgress[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

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

        const { data: progressData } = await supabase
          .from("module_progress")
          .select("module_id, status, progress_percent")
          .eq("user_id", user.id);

        const { data: certData } = await supabase
          .from("certificates")
          .select("module_id, cert_url, issued_at")
          .eq("user_id", user.id);

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

    const handleFocus = () => loadData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  useEffect(() => {
    if (!loading && targetModule) {
      const el = document.getElementById(targetModule);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("glow-highlight");
        setTimeout(() => el.classList.remove("glow-highlight"), 2000);
      }
    }
  }, [loading, targetModule]);

  const getStatus = (id: string) =>
    progress.find((p) => p.module_id === id)?.status || "not_started";

  const getProgress = (id: string) =>
    progress.find((p) => p.module_id === id)?.progress_percent ?? 0;

  const getCertificate = (id: string) =>
    certificates.find((c) => c.module_id === id);

  const handleStart = async (module: Module) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return router.push("/login");

      await supabase.from("module_progress").upsert({
        user_id: user.id,
        module_id: module.id,
        status: "in_progress",
        date_started: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      });

      window.open(module.url, "_blank");
    } catch (err) {
      console.error("Error starting module:", err);
    }
  };

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-200">Loading dashboard...</p>
    );
  }

  return (
    <main className="min-h-screen font-sans pb-20 bg-transparent flex flex-col items-center">
      {/* ======================================================
            HEADER — MATCHES HOMEPAGE EXACTLY
      ======================================================= */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-transparent">
        <Link href="/" className="flex items-center">
          <div className="bg-white border-2 border-semcmeBlue rounded-md shadow-sm px-3 py-2">
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

        <button onClick={() => router.back()} className="back-btn ml-auto">
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* PAGE TITLE */}
      <h1 className="text-4xl font-bold text-white mt-6 mb-10 text-center">
        EHR Learning Dashboard
      </h1>

      {/* MODULE CARDS */}
      <Accordion
        type="multiple"
        className="w-full max-w-5xl space-y-6 px-4 md:px-0"
        defaultValue={modules.map((m) => m.id)}
      >
        {modules.map((module) => {
          const status = getStatus(module.id);
          const progressPercent = getProgress(module.id);
          const cert = getCertificate(module.id);

          const statusColor =
            status === "completed"
              ? "bg-green-100 text-green-700 border-green-400"
              : status === "in_progress"
              ? "bg-blue-100 text-blue-700 border-blue-400"
              : "bg-gray-100 text-gray-700 border-gray-300";

          const thumbnailPath = module.url.replace(
            "/story.html",
            "/story_content/thumbnail.jpg"
          );

          return (
            <AccordionItem
              id={module.id}
              key={module.id}
              value={module.id}
              className="rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-white"
            >
              {/* ================= BLUE STRIP HEADER ================= */}
              <AccordionTrigger className="bg-semcmeBlue px-6 py-4 text-white text-lg font-semibold hover:bg-semcmeBlue">
                <div className="flex w-full items-center justify-between gap-6">
                  {/* Title */}
                  <span className="flex-1 text-left">{module.title}</span>

                  {/* Progress bar + percent + status pill */}
                  <div className="flex items-center gap-4">
                    {/* Progress percent */}
                    <span className="text-sm font-medium text-white">
                      {progressPercent}%
                    </span>

                    <div className="w-40 bg-white/30 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          status === "completed" ? "bg-green-400" : "bg-white"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full border ${statusColor}`}
                    >
                      {status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              {/* ================= WHITE CONTENT AREA ================= */}
              <AccordionContent className="bg-white px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Thumbnail */}
                <div className="w-full md:w-1/2 flex justify-center">
                  <img
                    src={thumbnailPath}
                    alt={`${module.title} thumbnail`}
                    className="w-[90%] h-auto rounded-lg border shadow-md object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/default-thumbnail.jpg";
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left space-y-6">
                  <p className="text-gray-700 text-base leading-relaxed">
                    {module.description ||
                      "No description available for this module."}
                  </p>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleStart(module)}
                      className="module-start-btn px-6 py-2 rounded-sm font-semibold transition"
                    >
                      {status === "not_started"
                        ? "Start Module"
                        : status === "completed"
                        ? "Review Module"
                        : "Continue Module"}
                    </Button>

                    {cert && status === "completed" && (
                      <a
                        href={cert.cert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          className="border-green-500 text-green-700 hover:bg-green-50 rounded-sm px-6 py-2"
                        >
                          🎓 Download Certificate
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </main>
  );
}
