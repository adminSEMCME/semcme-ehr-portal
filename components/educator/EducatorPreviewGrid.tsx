"use client";

import Image from "next/image";
import {
  ArrowRight,
  Check,
  ClipboardPenLine,
  FileSearch,
  Image as ImageIcon,
  MonitorPlay,
  RotateCcw,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPreviewUrl,
  type PreviewModule,
} from "@/lib/educatorPreview";

const mockEhrScreenshots = [
  {
    src: "/images/mock-ehr/new_encounter.png",
    width: 2880,
    height: 1558,
    title: "Open an assigned encounter",
    description:
      "Learners begin with an assigned simulated patient encounter from the case studies page.",
  },
  {
    src: "/images/mock-ehr/review_ehr_for_patient.png",
    width: 2880,
    height: 1552,
    title: "Review the patient’s EHR",
    description:
      "The chart includes previous visits, nursing notes, vitals, history, medications, results, imaging, and procedures.",
  },
  {
    src: "/images/mock-ehr/charting_1.png",
    width: 904,
    height: 512,
    title: "Watch the encounter and begin the note",
    description:
      "Learners use the simulated patient interview and EHR review to complete a structured physician note.",
  },
  {
    src: "/images/mock-ehr/charting_2.png",
    width: 466,
    height: 764,
    title: "Complete the clinical documentation",
    description:
      "The note includes medications, allergies, physical exam, assessment, diagnosis, and plan or orders.",
  },
  {
    src: "/images/mock-ehr/completed_encounter.png",
    width: 2638,
    height: 300,
    title: "Review the note or try again",
    description:
      "After submitting, learners can view their note or clear the submission and repeat the encounter.",
    wide: true,
  },
] as const;

function ModuleImage({ module }: { module: PreviewModule }) {
  const src =
    module.id === "mock-ehr"
      ? "/images/mock-ehr-thumbnail.png"
      : module.url.replace(
          "/story.html",
          "/story_content/thumbnail.jpg",
        );

  return (
    <img
      src={src}
      alt={`${module.title} preview`}
      className={`h-full w-full ${
        module.id === "mock-ehr"
          ? "bg-white object-contain"
          : "object-cover"
      }`}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = "true";
        image.src = "/images/default-thumbnail.jpg";
      }}
    />
  );
}

export default function EducatorPreviewGrid({
  modules,
}: {
  modules: PreviewModule[];
}) {
  if (modules.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
        Module information is temporarily unavailable. Please return shortly or
        contact SEMCME for assistance.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => {
        const isMockEhr = module.id === "mock-ehr";
        const objectives = module.objective_description
          ?.split("\n")
          .map((objective) => objective.trim())
          .filter(Boolean);

        if (isMockEhr) {
          return (
            <article
              key={module.id}
              className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-xl md:col-span-2 xl:col-span-3"
            >
              <div className="flex min-h-24 items-center justify-center bg-semcmeBlue px-5 py-4 text-center text-white">
                <h2 className="text-xl font-bold leading-snug">
                  {module.title}
                </h2>
              </div>

              <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                <div className="bg-slate-100">
                  <div className="h-64 overflow-hidden sm:h-80 lg:h-full lg:min-h-[430px]">
                    <ModuleImage module={module} />
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                    <ImageIcon className="size-4" aria-hidden="true" />
                    Illustrated educator overview
                  </div>

                  <p className="mt-5 text-lg font-semibold leading-relaxed text-slate-800">
                    The Mock EHR Clinical Encounter places learners in a
                    real-life patient scenario designed to test their knowledge
                    of EHR review and documentation.
                  </p>
                  <p className="mt-3 leading-relaxed text-slate-600">
                    Learners review the patient&apos;s electronic record, watch
                    the simulated encounter, and document their findings in a
                    structured clinical note.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <FileSearch
                        className="size-5 text-blue-700"
                        aria-hidden="true"
                      />
                      <p className="mt-2 text-sm font-bold text-slate-800">
                        Review a realistic chart
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        Examine prior visits, nursing notes, vitals,
                        medications, results, and procedures.
                      </p>
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                      <ClipboardPenLine
                        className="size-5 text-violet-700"
                        aria-hidden="true"
                      />
                      <p className="mt-2 text-sm font-bold text-slate-800">
                        Complete the encounter
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        Enter a clinical note using the information gathered
                        from the chart and patient encounter.
                      </p>
                    </div>
                    <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
                      <RotateCcw
                        className="size-5 text-teal-700"
                        aria-hidden="true"
                      />
                      <p className="mt-2 text-sm font-bold text-slate-800">
                        Clear and try again
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        Learners can clear a submission and repeat the encounter
                        if they want another attempt.
                      </p>
                    </div>
                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                      <Scale
                        className="size-5 text-orange-700"
                        aria-hidden="true"
                      />
                      <p className="mt-2 text-sm font-bold text-slate-800">
                        Compare with an ideal note
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        Learners may review an ideal note beside their own work
                        for reflection and comparison.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-800">
                      Practice-focused—not graded
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      The encounter is not graded or scored. It is designed for
                      practice, self-review, and improvement.
                    </p>
                  </div>
                </div>
              </div>

              <section className="border-t border-orange-200 bg-slate-50 p-6 md:p-8">
                <div className="mx-auto mb-6 max-w-3xl text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                    Screenshot Walkthrough
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    See How the Mock EHR Encounter Works
                  </h3>
                  <p className="mt-2 leading-relaxed text-slate-600">
                    Select any image to open the full-resolution screenshot in a
                    new tab.
                  </p>
                </div>

                <div className="grid items-start gap-5 md:grid-cols-2">
                  {mockEhrScreenshots.map((screenshot) => (
                    <figure
                      key={screenshot.src}
                      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
                        "wide" in screenshot && screenshot.wide
                          ? "md:col-span-2"
                          : ""
                      }`}
                    >
                      <a
                        href={screenshot.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open full-size screenshot: ${screenshot.title}`}
                        className="block bg-white"
                      >
                        <Image
                          src={screenshot.src}
                          alt={`${screenshot.title}. ${screenshot.description}`}
                          width={screenshot.width}
                          height={screenshot.height}
                          sizes={
                            "wide" in screenshot && screenshot.wide
                              ? "(max-width: 768px) 100vw, 1100px"
                              : "(max-width: 768px) 100vw, 550px"
                          }
                          className={`w-full object-contain transition-opacity hover:opacity-90 ${
                            screenshot.src.endsWith("charting_2.png")
                              ? "max-h-[520px]"
                              : "h-auto"
                          }`}
                        />
                      </a>
                      <figcaption className="border-t border-slate-100 p-5">
                        <p className="font-bold text-slate-900">
                          {screenshot.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {screenshot.description}
                        </p>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            </article>
          );
        }

        return (
          <article
            key={module.id}
            className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex w-full flex-col">
              <div className="flex min-h-24 items-center justify-center bg-semcmeBlue px-5 py-4 text-center text-white">
                <h2 className="text-lg font-bold leading-snug">{module.title}</h2>
              </div>

              <div className="h-56 overflow-hidden bg-slate-100">
                <ModuleImage module={module} />
              </div>

              <div className="flex grow flex-col p-6">
                {objectives && objectives.length > 0 ? (
                  <ul className="space-y-3 text-sm text-slate-700">
                    {objectives.map((objective) => (
                      <li key={objective} className="flex gap-2">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-teal-600"
                          aria-hidden="true"
                        />
                        <span className="leading-relaxed">{objective}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="leading-relaxed text-slate-700">
                    {module.description ||
                      "Open this module to review its educational content and learning experience."}
                  </p>
                )}
                <div className="mt-auto pt-6">
                  <Button asChild size="card" className="w-full font-bold">
                    <a
                      href={getPreviewUrl(module.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Preview ${module.title}`}
                    >
                      <MonitorPlay className="size-4" aria-hidden="true" />
                      Preview Module
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
