//app/dashboards/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Award, ChevronDown, Download } from "lucide-react";
import Footer from "@/components/Footer";
import AppHeader from "@/components/AppHeader";
import {
  focusFirstDescendant,
  handleDropdownKeyDown,
} from "@/lib/keyboardNavigation";

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

const CE_EXCLUDED_MODULE_IDS = [
  "CME1",
  "CME2",
  "intro",
  "mock-ehr",
  "ume-assmt-v1",
];

interface Module {
  id: string;
  title: string;
  description?: string;
  objective_description?: string;
  url: string;
  ce_activity_code?: string;
  order_index?: number;
  skill_level?: string;
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

type LearningPathKey = "ume" | "gme" | "cme";

const LEARNING_PATHS: {
  key: LearningPathKey;
  title: string;
  shortTitle: string;
  levels: string[];
}[] = [
  {
    key: "ume",
    title: "UME Path",
    shortTitle: "UME",
    levels: ["novice", "all"],
  },
  {
    key: "gme",
    title: "GME Path",
    shortTitle: "GME",
    levels: ["intermediate", "all"],
  },
  {
    key: "cme",
    title: "CME Path",
    shortTitle: "CME",
    levels: ["advanced", "all"],
  },
];

const getPathCertificateId = (path: LearningPathKey) => `path-${path}`;

const moduleBelongsToPath = (module: Module, path: LearningPathKey) => {
  const levels = getSkillLevels(module.skill_level);
  const pathConfig = LEARNING_PATHS.find((item) => item.key === path);
  if (!pathConfig) return false;
  return pathConfig.levels.some((level) => levels.includes(level));
};

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
  const [canCollectCE, setCanCollectCE] = useState(false);
  const [showCEModal, setShowCEModal] = useState(false);
  const [activeCEModule, setActiveCEModule] = useState<Module | null>(null);
  const [showAccredModal, setShowAccredModal] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [activeAccredModule, setActiveAccredModule] = useState<Module | null>(
    null,
  );
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showCEInfoModal, setShowCEInfoModal] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  /* ANNOUNCEMENTS */
  useEffect(() => {
    async function checkAnnouncements() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const userId = session.user.id;

      // 🔹 Get announcements
      const { data: announcements } = await supabase
        .from("announcements")
        .select("*")
        .eq("active", true);

      if (!announcements || announcements.length === 0) return;

      // 🔹 Get full user profile (needed for targeting)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, email, created_at")
        .eq("id", userId)
        .single();

      const userRole = profile?.role;
      const userEmail = profile?.email || session.user.email;
      const userCreatedAt = profile?.created_at || session.user.created_at;

      for (const a of announcements) {
        let shouldShow = false;

        // ✅ 1. ALL USERS
        if (a.target_type === "all") {
          shouldShow = true;
        }

        // ✅ 2. EXISTING USERS
        else if (a.target_type === "existing") {
          if (a.target_users_created_before && userCreatedAt) {
            shouldShow =
              new Date(userCreatedAt) <=
              new Date(a.target_users_created_before);
          }
        }

        // ✅ 3. ROLE TARGETING
        else if (a.target_type === "role") {
          if (a.target_roles && userRole) {
            shouldShow = a.target_roles.includes(userRole);
          }
        }

        // ✅ 4. SPECIFIC USER
        else if (a.target_type === "user") {
          if (a.target_user_email && userEmail) {
            shouldShow =
              a.target_user_email.toLowerCase() === userEmail.toLowerCase();
          }
        }

        if (!shouldShow) continue;

        // 🔹 Check if user already saw this announcement
        const { data: read } = await supabase
          .from("announcement_reads")
          .select("id")
          .eq("announcement_id", a.id)
          .eq("user_id", userId)
          .maybeSingle();

        if (!read) {
          setAnnouncement(a);
          setShowAnnouncement(true);
          break;
        }
      }
    }

    checkAnnouncements();
  }, []);

  type GroupFilter = "all" | "ume" | "gme" | "cme";

  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [groupOpen, setGroupOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement | null>(null);

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

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error loading profile role:", profileError);
        } else {
          const role = profileData?.role?.toLowerCase();

          setCanCollectCE(
            role === "practicing physician/faculty" || role === "nursing",
          );
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
        // 🔹 Show CE info modal ONLY on first completed module
        const role = profileData?.role?.toLowerCase();
        const isCEUser =
          role === "practicing physician/faculty" || role === "nursing";

        const { data: cePref } = await supabase
          .from("user_ce_preferences")
          .select("ce_info_seen")
          .eq("user_id", user.id)
          .maybeSingle();

        if (isCEUser && progressData && !cePref?.ce_info_seen) {
          const completedCount = progressData.filter(
            (p) => p.status === "completed",
          ).length;

          if (completedCount === 1) {
            setShowCEInfoModal(true);
          }
        }
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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profileData?.role?.toLowerCase();
      const isCEUser =
        role === "practicing physician/faculty" || role === "nursing";

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

      // 🔹 Show CE info modal immediately after first completion
      const { data: cePref } = await supabase
        .from("user_ce_preferences")
        .select("ce_info_seen")
        .eq("user_id", user.id)
        .maybeSingle();

      if (isCEUser && progressData && !cePref?.ce_info_seen) {
        const completedCount = progressData.filter(
          (p) => p.status === "completed",
        ).length;

        if (completedCount === 1) {
          setShowCEInfoModal(true);
        }
      }
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

  const hasCertificate = (id: string) =>
    certificates.some((c) => c.module_id === id && c.cert_url);

  const handleStart = async (module: Module) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return router.push("/login");

      // 🔹 Check if module is in CE exclusion list
      const isCEExcluded = CE_EXCLUDED_MODULE_IDS.includes(module.id);
      // 🔹 If CE user, check if they skipped accreditation before
      if (canCollectCE && !isCEExcluded) {
        const { data } = await supabase
          .from("module_accreditation_views")
          .select("dont_show_again")
          .eq("user_id", user.id)
          .eq("module_id", module.id)
          .maybeSingle();

        if (!data?.dont_show_again) {
          setActiveAccredModule(module);
          setShowAccredModal(true);
          return;
        }
      }

      // 🔹 Continue with your original logic
      await supabase.from("module_progress").upsert({
        user_id: user.id,
        module_id: module.id,
        status: "in_progress",
        progress_percent: getProgress(module.id),
        date_started: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      });

      // ✅ MOCK-EHR MODULE
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

      // ✅ ALL OTHER MODULES
      window.open(module.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error starting module:", err);
    }
  };

  const handleConfirmAccreditation = async () => {
    if (!activeAccredModule) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return;

    // Save preference if checked
    if (dontShowAgain) {
      await supabase.from("module_accreditation_views").upsert({
        user_id: user.id,
        module_id: activeAccredModule.id,
        dont_show_again: true,
      });
    }

    // Continue normal start logic
    await supabase.from("module_progress").upsert({
      user_id: user.id,
      module_id: activeAccredModule.id,
      status: "in_progress",
      progress_percent: getProgress(activeAccredModule.id),
      date_started: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
    });

    if (activeAccredModule.url.includes("mock-ehr")) {
      const payload = {
        sub: user.id,
        email: user.email,
      };

      const token = btoa(JSON.stringify(payload));
      const safeToken = encodeURIComponent(token);

      window.open(
        `https://mock-ehr.semcme.org/?sso=${safeToken}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else {
      window.open(activeAccredModule.url, "_blank", "noopener,noreferrer");
    }

    // Reset modal state
    setShowAccredModal(false);
    setActiveAccredModule(null);
    setDontShowAgain(false);
  };

  const getCertificateDownloadName = (moduleId: string) => {
    const path = LEARNING_PATHS.find(
      (item) => getPathCertificateId(item.key) === moduleId,
    );
    const label = path
      ? `${path.shortTitle} Learning Path Certificate`
      : `${modules.find((module) => module.id === moduleId)?.title ?? "Module"} Certificate`;

    return `${label
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()}.pdf`;
  };

  const downloadCertificate = async (url: string, fileName: string) => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Certificate download failed");

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handleGenerateCertificate = async (moduleId: string) => {
    try {
      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ module_id: moduleId }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.error || "Failed to generate certificate");
      }

      // 🔄 Refresh dashboard data
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      if (result?.cert_url) {
        setCertificates((current) => {
          const nextCert = {
            module_id: moduleId,
            cert_url: result.cert_url,
            issued_at: result.issued_at || new Date().toISOString(),
          };
          const existing = current.filter((c) => c.module_id !== moduleId);
          return [...existing, nextCert];
        });
      }

      const { data: certData } = await supabase
        .from("certificates")
        .select("module_id, cert_url, issued_at")
        .eq("user_id", user.id);

      if (result?.cert_url) {
        const nextCert = {
          module_id: moduleId,
          cert_url: result.cert_url,
          issued_at: result.issued_at || new Date().toISOString(),
        };
        const refreshed = (certData || []).filter(
          (c) => c.module_id !== moduleId,
        );
        setCertificates([...refreshed, nextCert]);
      } else {
        setCertificates(certData || []);
      }

      if (result?.cert_url) {
        await downloadCertificate(
          result.cert_url,
          getCertificateDownloadName(moduleId),
        );
      }
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Error generating certificate",
      );
    }
  };

  const pathProgress = LEARNING_PATHS.map((path) => {
    const pathModules = modules.filter((module) =>
      moduleBelongsToPath(module, path.key),
    );
    const completedCount = pathModules.filter(
      (module) => getStatus(module.id) === "completed",
    ).length;
    const totalCount = pathModules.length;
    const percent =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const certId = getPathCertificateId(path.key);
    const cert = getCertificate(certId);

    return {
      ...path,
      completedCount,
      totalCount,
      percent,
      isComplete: totalCount > 0 && completedCount === totalCount,
      certId,
      cert,
    };
  });

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
    <>
      <main className="min-h-screen pb-20 bg-transparent flex flex-col items-center font-sans">
        <AppHeader action="logout" />

        {/* PAGE TITLE */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-6 mb-8 text-center leading-tight px-4">
          Improving EHR Use for Better Outcomes: <br />
          User Dashboard
        </h1>

        {/* GROUP FILTER */}
        <div className="w-full flex justify-center mb-4 px-4">
          <div ref={groupDropdownRef} className="relative w-full max-w-104">
            <Button
              type="button"
              onClick={() => setGroupOpen((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setGroupOpen(true);
                  focusFirstDescendant(
                    groupDropdownRef.current,
                    "[data-dropdown-menu]",
                  );
                }
              }}
              variant="dropdown"
              size="md"
            >
              <span>Filter Modules: {groupFilter.toUpperCase()}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  groupOpen ? "rotate-180" : ""
                }`}
              />
            </Button>

            {groupOpen && (
              <div
                data-dropdown-menu
                className="absolute mt-2 w-full overflow-hidden bg-white border border-slate-200 rounded-md shadow-lg z-50"
                onKeyDown={(e) =>
                  handleDropdownKeyDown(e, () => setGroupOpen(false))
                }
              >
                {(["all", "ume", "gme", "cme"] as GroupFilter[]).map((g) => (
                  <Button
                    key={g}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setGroupFilter(g);
                      setGroupOpen(false);
                    }}
                    variant="ghost"
                    className="h-auto w-full justify-start rounded-none px-4 py-2"
                  >
                    {g.toUpperCase()}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LEARNING PATH PROGRESS */}
        <section className="w-full max-w-7xl px-4 mb-8">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {pathProgress.map((path) => (
              <div
                key={path.key}
                className="rounded-md border border-white/60 bg-slate-100/95 shadow-sm"
              >
                <div className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-semcmeBlue">
                        {path.title}
                      </h2>
                      <p className="mt-0.5 text-xs font-medium text-slate-600">
                        {path.completedCount} of {path.totalCount} modules
                        complete
                      </p>
                    </div>

                    <span className="shrink-0 text-lg font-bold leading-none text-semcmeBlue">
                      {path.percent}%
                    </span>
                  </div>

                  <div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-300/80">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          path.isComplete ? "bg-green-500" : "bg-semcmeBlue"
                        }`}
                        style={{ width: `${path.percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-auto">
                    {path.isComplete ? (
                      path.cert?.cert_url ? (
                        <Button
                          asChild
                          variant="default"
                          size="card"
                          className="h-8 w-full px-3 text-xs font-semibold"
                        >
                          <a
                            href={path.cert.cert_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Download ${path.shortTitle} path certificate`}
                          >
                            <Download className="size-4" />
                            Download Certificate
                          </a>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleGenerateCertificate(path.certId)}
                          variant="default"
                          size="card"
                          className="h-8 w-full px-3 text-xs font-semibold"
                        >
                          <Award className="size-4" />
                          Generate Certificate
                        </Button>
                      )
                    ) : (
                      <div className="rounded-md border border-blue-200 bg-blue-100/70 px-3 py-1.5 text-center text-xs font-semibold text-semcmeBlue/70">
                        Certificate unlocks at 100%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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
                <div className="w-full bg-white sm:h-[220px] sm:overflow-hidden">
                  <img
                    src={thumbnailPath}
                    alt={`${module.title} thumbnail`}
                    className="w-full h-auto sm:h-full object-contain sm:object-cover"
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
                      size="card"
                      className="w-full font-semibold"
                    >
                      {status === "not_started"
                        ? "Start Module"
                        : status === "completed"
                          ? "Review Module"
                          : "Continue Module"}
                    </Button>

                    {status === "completed" && (
                      <>
                        {/* CE USERS */}
                        {canCollectCE &&
                        !CE_EXCLUDED_MODULE_IDS.includes(module.id) ? (
                          <div className="grid grid-cols-2 gap-3">
                            {/* LEFT BUTTON LOGIC */}
                            {!hasAssessment(module.id) ? (
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/post-assessment?module_id=${module.id}`,
                                  )
                                }
                                variant="assessment"
                                size="card"
                                className="w-full px-3 text-sm font-semibold"
                              >
                                Post Assessment
                              </Button>
                            ) : !cert?.cert_url ? (
                              <Button
                                onClick={() =>
                                  handleGenerateCertificate(module.id)
                                }
                                variant="warning"
                                size="card"
                                className="w-full px-3 text-sm font-semibold"
                              >
                                Generate Certificate
                              </Button>
                            ) : (
                              <Button
                                asChild
                                variant="success"
                                size="card"
                                className="w-full px-3 text-sm font-semibold"
                              >
                                <a
                                  href={cert.cert_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Download certificate for ${module.title}`}
                                >
                                  Download Certificate
                                </a>
                              </Button>
                            )}

                            {/* RIGHT BUTTON — ALWAYS CE */}
                            <Button
                              onClick={() => {
                                setActiveCEModule(module);
                                setShowCEModal(true);
                              }}
                              variant="accent"
                              size="card"
                              className="w-full px-3 text-sm font-semibold"
                            >
                              Collect CE Credits
                            </Button>
                          </div>
                        ) : (
                          /* NON-CE USERS */
                          <>
                            {!hasAssessment(module.id) && (
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/post-assessment?module_id=${module.id}`,
                                  )
                                }
                                variant="assessment"
                                size="card"
                                className="w-full font-semibold"
                              >
                                Post Assessment
                              </Button>
                            )}

                            {hasAssessment(module.id) && !cert?.cert_url && (
                              <Button
                                onClick={() =>
                                  handleGenerateCertificate(module.id)
                                }
                                variant="warning"
                                size="card"
                                className="w-full font-semibold"
                              >
                                Generate Certificate
                              </Button>
                            )}

                            {cert && (
                              <Button
                                asChild
                                variant="success"
                                size="card"
                                className="w-full font-semibold"
                              >
                                <a
                                  href={cert.cert_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Download certificate for ${module.title}`}
                                >
                                  Download Certificate
                                </a>
                              </Button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 🔹 CE FIRST-COMPLETION INFO MODAL */}
        {showCEInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-semcmeBlue">
                Important: CE vs Post Assessment
              </h2>

              <p className="text-sm text-gray-700 mb-4">
                You do NOT need to complete both options.
              </p>

              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-2 mb-4">
                <li>
                  If you want CE credit through McLaren, select
                  <strong> Collect CE Credits</strong>.
                </li>
                <li>
                  If you do NOT want CE credit, complete the
                  <strong> Post Assessment</strong> to receive a certificate of
                  completion.
                </li>
              </ul>

              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    const { data: sessionData } =
                      await supabase.auth.getSession();
                    const user = sessionData?.session?.user;
                    if (!user) return;

                    await supabase.from("user_ce_preferences").upsert({
                      user_id: user.id,
                      ce_info_seen: true,
                    });

                    setShowCEInfoModal(false);
                  }}
                >
                  Got It
                </Button>
              </div>
            </div>
          </div>
        )}

        {showAccredModal && activeAccredModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-semcmeBlue">
                Accreditation Statement
              </h2>

              <p className="text-sm text-gray-700 mb-4">
                Each module has its own accreditation statement. You must review
                the statement for this module before proceeding. After reviewing
                it once, you may select
                <strong> “Don't show this message again” </strong>
                and it will not appear again for this module.
              </p>

              <Button
                onClick={() => setShowPDF(true)}
                variant="link"
                className="mb-4 flex h-auto w-full max-w-full items-start justify-start whitespace-normal p-0 text-left font-medium leading-snug text-blue-600"
              >
                <span className="min-w-0 wrap-break-word">
                  {activeAccredModule.title} Accreditation Statement (PDF)
                </span>
              </Button>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="dontShow"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                <label htmlFor="dontShow" className="text-sm text-gray-700">
                  Don't show this message again
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAccredModal(false);
                    setActiveAccredModule(null);
                  }}
                >
                  Cancel
                </Button>

                <Button onClick={handleConfirmAccreditation}>
                  Continue to Module
                </Button>
              </div>
            </div>
          </div>
        )}
        {showPDF && activeAccredModule && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70">
            <div className="bg-white w-[90vw] h-[90vh] rounded-md shadow-xl flex flex-col">
              <div className="flex justify-between items-center px-4 py-2 border-b">
                <h3 className="font-semibold text-semcmeBlue">
                  Accreditation Statement
                </h3>

                <Button
                  onClick={() => setShowPDF(false)}
                  variant="ghost"
                  className="text-gray-500 hover:text-black"
                >
                  Close
                </Button>
              </div>

              <iframe
                src={`/accreditation/${activeAccredModule.id}.pdf`}
                className="w-full flex-1"
              />
            </div>
          </div>
        )}
        {showAnnouncement && announcement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-semcmeBlue">
                {announcement.title}
              </h2>

              <p className="text-sm text-gray-700 whitespace-pre-line mb-6">
                {announcement.message}
              </p>

              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();

                    if (!session?.user) return;

                    await supabase.from("announcement_reads").upsert(
                      {
                        user_id: session.user.id,
                        announcement_id: announcement.id,
                      },
                      { onConflict: "user_id,announcement_id" },
                    );

                    setShowAnnouncement(false);
                  }}
                >
                  Got It
                </Button>
              </div>
            </div>
          </div>
        )}
        {showCEModal && activeCEModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-semcmeBlue">
                Collect CE Credits
              </h2>

              <p className="text-sm text-gray-700 mb-4">
                To claim continuing education (CE) credit for{" "}
                <strong>{activeCEModule.title}</strong>, follow the steps below.
              </p>

              <ol className="text-sm text-gray-700 list-decimal pl-5 space-y-2 mb-4">
                <li>
                  Sign in to CME Tracker:
                  <br />
                  <a
                    href="https://cmetracker.net/MCLAREN"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                    title="Open CME Tracker in a new tab"
                  >
                    https://cmetracker.net/MCLAREN
                  </a>
                </li>
                <li>
                  Select <strong>Sign In / Create Account</strong>
                </li>
                <li>
                  Navigate to <strong>My Portal</strong>
                </li>
                <li>
                  Select <strong>Claim Credit</strong>
                </li>
                <li>
                  Enter activity code:
                  <div className="mt-1 font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                    {activeCEModule.ce_activity_code || "CODE-TBD"}
                  </div>
                </li>
                <li>Complete the evaluation and attest to your credits</li>
              </ol>

              <p className="text-xs text-gray-500 mb-4">
                Preferred browsers: Chrome, Firefox, Microsoft Edge
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCEModal(false);
                    setActiveCEModule(null);
                  }}
                >
                  Cancel
                </Button>

                <Button
                  onClick={() => {
                    window.open("https://cmetracker.net/MCLAREN", "_blank");
                    setShowCEModal(false);
                    setActiveCEModule(null);
                  }}
                  variant="accent"
                >
                  Go to CME Tracker
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
