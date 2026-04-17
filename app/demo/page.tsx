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

  const [isExpanded, setIsExpanded] = useState(false);

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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 text-center leading-tight px-4">
          Demo Dashboard
        </h1>

        {/* NOTICE */}
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-6 py-3 rounded-md mb-6 text-sm text-center max-w-2xl">
          You are viewing a demo version of the EHR Learning Portal. Progress
          shown here is simulated. Register for full access to all 18 modules
          and features.
        </div>

        {/* DEMO DESCRIPTION SECTION */}
        <div className="max-w-6xl mx-auto mb-10">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg pt-6 md:pt-8 text-gray-700 text-sm md:text-base leading-relaxed">
            {/* TITLE */}
            <div
              onClick={() => setIsExpanded((prev) => !prev)}
              className="cursor-pointer"
            >
              <h2 className="text-xl md:text-2xl font-bold text-semcmeBlue text-center mb-2">
                Improving EHR Use for Better Outcomes: User Guide
              </h2>

              <p className="text-center text-sm text-semcmeBlue mb-6">
                {isExpanded ? "Show less ↑" : "Click to expand ↓"}
              </p>
            </div>

            {/* COLLAPSIBLE CONTENT */}
            <div
              className={`transition-all duration-500 overflow-hidden ${
                isExpanded ? "max-h-[3000px]" : "max-h-[120px]"
              }`}
            >
              {/* PARAGRAPHS */}
              <div className="space-y-4 max-w-5xl mx-auto">
                <p>
                  Improving Documentation for Better Outcomes educational
                  curriculum is designed to help practicing physicians, faculty,
                  learners, and other healthcare professionals strengthen their
                  documentation skills within electronic health records (EHRs).
                  As EHRs have become the central link across every area of
                  clinical practice, accurate and meaningful documentation plays
                  a critical role in improving patient safety, supporting
                  quality measures, enhancing communication, and promoting more
                  cost-effective care. By improving the quality of data entered
                  into the EHR, clinicians also improve the reliability of the
                  data used to guide decisions, measure outcomes, and ultimately
                  deliver better patient care.
                </p>

                <p>
                  This curriculum offers a continuum of learning modules
                  tailored to all stages of medical education and clinical
                  practice, from undergraduate medical students to residents,
                  fellows, and experienced practicing clinicians. The program is
                  organized into three progressive learning levels:
                </p>
              </div>

              {/* LEARNING LEVELS */}
              <div className="mt-4 max-w-4xl mx-auto">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Fundamental Concepts (UME)</strong> for early
                    learners developing core EHR skills.
                  </li>
                  <li>
                    <strong>Intermediate Modules (GME)</strong> for graduate
                    medical education focused on advanced documentation and
                    workflow integration.
                  </li>
                  <li>
                    <strong>Advanced CME Modules (CME)</strong> for practicing
                    clinicians seeking to optimize efficiency, quality metrics,
                    transitions of care, and performance measures in areas such
                    as diabetes, obesity, and social determinants of health.
                  </li>
                </ul>
              </div>

              {/* CONTINUED TEXT */}
              <div className="mt-4 space-y-4 max-w-5xl mx-auto">
                <p>
                  The complete series is designed to support teachers,
                  instructors, residency leadership, and faculty in implementing
                  these modules at the appropriate learner level. Each module
                  includes detailed objectives, key concepts, and guidance for
                  curricular integration, making it easy to align content with
                  educational goals across UME, GME, and CME settings. For
                  practicing physicians and nurses, many modules also offer
                  continuing education credit opportunities, further supporting
                  lifelong learning and excellence in clinical documentation.
                </p>

                <p className="font-semibold">
                  Improving EHR Use for Better Outcomes Allows You to:
                </p>
              </div>

              {/* FEATURES LIST */}
              <div className="mt-2 max-w-4xl mx-auto">
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Explore 18 learning modules designed to improve your
                    knowledge and application of EHRs.
                  </li>
                  <li>
                    Filter modules to access services designed to target
                    different learning levels.
                  </li>
                  <li>
                    Follow multiple case studies and complete practice
                    exercises.
                  </li>
                  <li>
                    Access your own personalized dashboard with saved progress.
                  </li>
                  <li>Download certificates for proof of completion.</li>
                  <li>
                    Obtain CME (available for practicing physicians and nurses).
                  </li>
                </ul>
              </div>

              {/* AVAILABLE MODULES */}
              <div className="mt-6 px-10">
                <h3 className="text-lg font-semibold text-semcmeBlue text-center mb-4">
                  Available Modules
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-sm">
                  <ul className="space-y-1">
                    <li>
                      • Introduction to EHR Educational Series - Improving EHR
                      Use for Better Outcomes
                    </li>
                    <li>• Electronic Health Records: An Introduction</li>
                    <li>• Practicing Fundamental Skills</li>
                    <li>• The Note: Documentation in an EHR</li>
                    <li>
                      • Introduction to Coding and Billing: ICD-10, CPT, E/M
                      Codes
                    </li>
                    <li>• Order Entry and Order Sets</li>
                    <li>• Effective Use of EHRs</li>
                    <li>• Practice Documentation - Hypertension Case</li>
                    <li>• High-Yield Notes</li>
                    <li>• Coding and Billing: Office Workflow</li>
                  </ul>

                  <ul className="space-y-1">
                    <li>• Coding and Billing: CPT Coding</li>
                    <li>
                      • Coding and Billing: ICD-10 and How to Build Diagnoses
                    </li>
                    <li>• Documentation of Social Determinants of Health</li>
                    <li>
                      • Improving Efficiency and Effectiveness in the Use of
                      EHRs
                    </li>
                    <li>
                      • Improving Quality Metrics for Readmission, Transition of
                      Care and Medication Reconciliation (Emergency Department
                      to PCP)
                    </li>
                    <li>
                      • Improving Quality Metrics for Readmission, Transition of
                      Care and Medication Reconciliation (Hospital to PCP)
                    </li>
                    <li>
                      • Documentation of Evidence-Based Management of Obesity
                      and Performance Measures
                    </li>
                    <li>
                      • Documentation of Evidence-Based Management of Diabetes
                      and Performance Measures
                    </li>
                  </ul>
                </div>
              </div>

              {/* FOOTER TEXT */}
              <p className="mt-4 p-8 text-center text-gray-700 text-xs md:text-sm">
                The Educator Demo Site provides a sample of the modules for
                review. For further information, or to request information on
                subscription to the complete series of modules, please contact
                jnzyrsh@semcme.org
              </p>
            </div>
          </div>
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
