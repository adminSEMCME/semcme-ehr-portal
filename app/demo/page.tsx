"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

interface Module {
  id: string;
  title: string;
  url: string;
  objective_description?: string;
}

const DEMO_MODULES: Module[] = [
  {
    id: "intro",
    title: "Introduction to EHR Educational Series",
    url: "/modules/intro/story.html",
    objective_description:
      "Understand the role of EHRs in modern clinical practice\nIdentify common challenges\nRecognize improvement opportunities",
  },
  {
    id: "M1",
    title: "Electronic Health Records: An Introduction",
    url: "/modules/M1/story.html",
    objective_description:
      "Differentiate paper vs electronic records\nDemonstrate navigation\nApply documentation skills",
  },
  {
    id: "M3",
    title: "The Note: Documentation in an EHR",
    url: "/modules/M3/story.html",
    objective_description:
      "Explain documentation importance\nIdentify key components\nRecognize expectations",
  },
];

export default function DemoDashboard() {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const [activeModal, setActiveModal] = useState<
    "assessment" | "ce" | "certificate" | null
  >(null);

  const handleStart = (module: Module) => {
    window.open(module.url, "_blank", "noopener,noreferrer");

    setProgress((prev) => ({ ...prev, [module.id]: 100 }));
    setCompleted((prev) => ({ ...prev, [module.id]: true }));
  };

  return (
    <>
      <main className="min-h-screen pb-20 flex flex-col items-center font-sans">
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

          <div className="flex gap-3">
            <Button asChild variant="semcme">
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>

        {/* TITLE */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-6 mb-4 text-center leading-tight px-4">
          Improving EHR Use for Better Outcomes: <br />
          Demo Dashboard
        </h1>

        {/* NOTICE */}
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-6 py-3 rounded-md mb-6 text-sm text-center max-w-2xl">
          You are viewing a demo version of the EHR Learning Portal. Progress
          shown here is simulated. Register for full access to all 18 modules
          and features.
        </div>

        {/* MODULE GRID */}
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-4">
          {DEMO_MODULES.map((module) => {
            const pct = progress[module.id] ?? 0;
            const isComplete = completed[module.id];

            const thumbnailPath = module.url.replace(
              "/story.html",
              "/story_content/thumbnail.jpg",
            );

            const objectives = module.objective_description
              ?.split("\n")
              .filter(Boolean);

            return (
              <div
                key={module.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 flex flex-col"
              >
                {/* HEADER */}
                <div className="bg-semcmeBlue text-white px-4 pt-4 pb-3 flex flex-col gap-2">
                  {/* TITLE */}
                  <div className="min-h-12 flex items-center justify-center text-center px-2">
                    <h2 className="font-semibold leading-tight text-[1.05rem]">
                      {module.title}
                    </h2>
                  </div>

                  {/* PROGRESS ROW */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{pct}%</span>

                    <div className="flex-1 bg-white/30 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-1 transition-all duration-500 ${
                          isComplete ? "bg-green-400" : "bg-white"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap ${
                        isComplete
                          ? "bg-green-100 text-green-700 border-green-400"
                          : "bg-gray-100 text-gray-600 border-gray-300"
                      }`}
                    >
                      {isComplete ? "completed" : "not started"}
                    </span>
                  </div>
                </div>

                {/* IMAGE */}
                <div className="w-full bg-white h-[220px] overflow-hidden">
                  <img
                    src={thumbnailPath}
                    alt={module.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/default-thumbnail.jpg";
                    }}
                  />
                </div>

                {/* CONTENT */}
                <div className="p-6 flex flex-col gap-4 grow min-h-[260px]">
                  <ul className="text-gray-700 text-sm list-disc pl-5 space-y-2">
                    {objectives?.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>

                  <div className="mt-auto flex flex-col gap-3">
                    <Button
                      onClick={() => handleStart(module)}
                      className="w-full"
                    >
                      {isComplete ? "Review Module" : "Start Module"}
                    </Button>

                    {isComplete && (
                      <>
                        <Button
                          onClick={() => setActiveModal("assessment")}
                          className="bg-blue-600 text-white"
                        >
                          Post Assessment
                        </Button>

                        <Button
                          onClick={() => setActiveModal("ce")}
                          className="bg-purple-600 text-white"
                        >
                          Collect CE Credits
                        </Button>

                        <Button
                          onClick={() => setActiveModal("certificate")}
                          className="bg-green-600 text-white"
                        >
                          Download Certificate
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODALS */}

        {activeModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setActiveModal(null)} // 👈 click outside closes
          >
            <div
              className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl relative"
              onClick={(e) => e.stopPropagation()} // 👈 prevents closing when clicking inside
            >
              {/* CLOSE BUTTON (X) */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-black text-lg font-bold"
              >
                ✕
              </button>

              {/* TITLE */}
              <h2 className="text-xl font-semibold mb-4 text-semcmeBlue">
                {activeModal === "assessment" && "Post Assessment"}
                {activeModal === "ce" && "Continuing Education Credits"}
                {activeModal === "certificate" && "Certificates"}
              </h2>

              {/* CONTENT */}
              <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">
                {activeModal === "assessment" &&
                  "After each module there is a post assessment. Completing it generates a certificate of completion.\n\nCE eligible users do not need to complete the post assessment to access CE credits."}

                {activeModal === "ce" &&
                  "Practicing physicians and nurses can collect CE credits after completion of a module.\n\nRegistered users will receive an activity code per module to use in the CE system."}

                {activeModal === "certificate" &&
                  "Certificates of completion are generated after completing the post assessment for each module.\n\nRegistered users can access their certificates and download them as PDFs."}
              </p>

              {/* BUTTON */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setActiveModal(null)}
                  className="bg-semcmeBlue text-white hover:bg-blue-800"
                >
                  Got It
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
