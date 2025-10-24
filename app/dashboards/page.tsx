"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

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

export default function DashboardPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<ModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // ✅ Get active session
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          router.push("/login");
          return;
        }

        // ✅ Fetch modules
        const { data: modulesData } = await supabase
          .from("modules")
          .select("*")
          .order("id", { ascending: true });

        // ✅ Fetch latest progress
        const { data: progressData } = await supabase
          .from("module_progress")
          .select("module_id, status, progress_percent")
          .eq("user_id", user.id);

        setModules(modulesData || []);
        setProgress(progressData || []);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    // 👇 Run immediately when the page loads
    loadData();

    // 👇 Run again automatically whenever user comes back to the tab
    const handleFocus = () => {
      console.log("🔄 Refetching progress on tab focus...");
      loadData();
    };
    window.addEventListener("focus", handleFocus);

    // 🧹 Clean up listener when leaving page
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  const getStatus = (moduleId: string) => {
    const item = progress.find((p) => p.module_id === moduleId);
    return item ? item.status : "not_started";
  };

  const getProgress = (moduleId: string) => {
    const item = progress.find((p) => p.module_id === moduleId);
    return item?.progress_percent ?? 0;
  };

  const handleStart = async (module: Module) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        router.push("/login");
        return;
      }

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

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-600">Loading dashboard...</p>
    );

  return (
    <div className="flex flex-col items-center justify-start w-full py-10 px-6">
      <h1 className="text-4xl font-bold text-semcmeBlue mb-8 text-center">
        EHR Learning Dashboard
      </h1>

      <Accordion
        type="multiple"
        className="w-full max-w-5xl space-y-4"
        defaultValue={modules.map((m) => m.id)}
      >
        {modules.map((module) => {
          const status = getStatus(module.id);
          const progressPercent = getProgress(module.id);

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
              key={module.id}
              value={module.id}
              className="rounded-lg overflow-hidden shadow-lg border border-gray-200"
            >
              {/* Accordion Header */}
              <AccordionTrigger className="bg-semcmeBlue text-white px-6 py-4 text-lg font-semibold flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Title */}
                <span className="flex-1">{module.title}</span>

                {/* Progress + Status */}
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto md:justify-end">
                  {/* Progress bar */}
                  <div className="flex items-center gap-3 w-full md:w-64">
                    <div className="w-full bg-white/30 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          status === "completed" ? "bg-green-400" : "bg-white"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {progressPercent}%
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${statusColor} whitespace-nowrap`}
                  >
                    {status.replace("_", " ")}
                  </span>
                </div>
              </AccordionTrigger>

              {/* Accordion Body */}
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

                {/* Text + Button */}
                <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left space-y-6">
                  <p className="text-gray-700 text-base leading-relaxed">
                    {module.description ||
                      "No description available for this module."}
                  </p>

                  <Button
                    onClick={() => handleStart(module)}
                    className="bg-semcmeBlue text-white hover:bg-[#034f8c] transition rounded-lg px-6 py-2"
                  >
                    {status === "not_started"
                      ? "Start Module"
                      : status === "completed"
                      ? "Review Module"
                      : "Continue Module"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
