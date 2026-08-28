"use client";

import { useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseMedical,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  FileText,
  Filter,
  GraduationCap,
  HeartPulse,
  Hospital,
  Mail,
  MonitorPlay,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  Workflow,
} from "lucide-react";
import { GuideSectionHeading } from "./guides/GuidePrimitives";

interface WebsiteGuideContentProps {
  defaultExpanded?: boolean;
  collapsible?: boolean;
  showFooterText?: boolean;
}

const pathwayDetails = [
  {
    number: "01",
    label: "Fundamental Concepts — UME",
    audience: "Medical students and early learners",
    focus:
      "EHR basics, documentation, order entry, coding, patient-centered use",
    title: "FUNDAMENTAL CONCEPTS | UME",
    lead: "Build a strong foundation in effective EHR use.",
    icon: GraduationCap,
    gradient: "from-sky-600 to-blue-800",
    points: [
      "EHR fundamentals and terminology",
      "Effective clinical documentation",
      "Order entry and order sets",
      "Introductory coding and billing",
      "Patient-centered EHR use",
      "Practice-based documentation exercises",
    ],
  },
  {
    number: "02",
    label: "Intermediate Learning — GME",
    audience: "Residents and fellows",
    focus: "High-yield notes, workflow integration, coding, efficiency",
    title: "INTERMEDIATE LEARNING | GME",
    lead: "Move from foundational skills to real-world clinical workflow.",
    icon: Stethoscope,
    gradient: "from-violet-600 to-indigo-800",
    points: [
      "High-yield clinical notes",
      "Advanced documentation practices",
      "Coding and billing",
      "ICD-10 and CPT coding",
      "Workflow optimization",
      "Efficient and effective EHR use",
    ],
  },
  {
    number: "03",
    label: "Advanced Learning — CME",
    audience: "Practicing clinicians",
    focus:
      "Quality metrics, transitions of care, performance measures, population health",
    title: "ADVANCED LEARNING | CME",
    lead: "Optimize documentation, quality, efficiency, and outcomes.",
    icon: BriefcaseMedical,
    gradient: "from-teal-600 to-cyan-800",
    points: [
      "Social determinants of health",
      "Transitions of care",
      "Medication reconciliation",
      "Readmission and quality metrics",
      "Evidence-based management of obesity",
      "Evidence-based management of diabetes",
      "Clinical performance measures",
    ],
  },
];

const learnerFeatures = [
  [BookOpenCheck, "Explore 18 interactive learning modules"],
  [Filter, "Filter content by learner level"],
  [FileText, "Apply concepts through case studies and practice exercises"],
  [BarChart3, "Track progress through a personalized dashboard"],
  [RefreshCw, "Save progress and return to modules later"],
  [BadgeCheck, "Download certificates of completion"],
  [Star, "Earn continuing education credit where available for physicians and nurses"],
] as const;

const moduleGroups = [
  {
    title: "FOUNDATIONS",
    icon: BookOpenCheck,
    tone: "blue" as const,
    modules: [
      "Introduction to the EHR Educational Series: Improving EHR Use for Better Outcomes",
      "Electronic Health Records: An Introduction",
      "Practicing Fundamental Skills",
      "The Note: Documentation in an EHR",
      "Introduction to Coding and Billing: ICD-10, CPT, and E/M Codes",
      "Order Entry and Order Sets",
      "Effective Use of EHRs",
      "Practice Documentation: Hypertension Case",
    ],
  },
  {
    title: "DOCUMENTATION, CODING & WORKFLOW",
    icon: ClipboardCheck,
    tone: "violet" as const,
    modules: [
      "High-Yield Notes",
      "Coding and Billing: Office Workflow",
      "Coding and Billing: CPT Coding",
      "Coding and Billing: ICD-10 and How to Build Diagnoses",
      "Documentation of Social Determinants of Health",
      "Improving Efficiency and Effectiveness in the Use of EHRs",
    ],
  },
  {
    title: "QUALITY, TRANSITIONS OF CARE & PERFORMANCE",
    icon: Star,
    tone: "teal" as const,
    modules: [
      "Improving Quality Metrics for Readmission, Transition of Care, and Medication Reconciliation: Emergency Department to PCP",
      "Improving Quality Metrics for Readmission, Transition of Care, and Medication Reconciliation: Hospital to PCP",
      "Documenting Evidence-Based Management of Obesity and Performance Measures",
      "Documenting Evidence-Based Management of Diabetes and Performance Measures",
    ],
  },
] as const;

const documentationBenefits = [
  [ShieldCheck, "Improve patient safety and clinical decision-making"],
  [ArrowLeftRight, "Strengthen communication across the care team"],
  [Hospital, "Support continuity and transitions of care"],
  [BadgeCheck, "Capture meaningful quality and performance data"],
  [Workflow, "Improve efficiency and clinical workflow"],
  [CircleDollarSign, "Strengthen coding and billing accuracy"],
  [Database, "Improve data used for research and quality improvement"],
  [Activity, "Support population health initiatives"],
  [BrainCircuit, "Prepare clinicians for emerging data-driven and AI-enabled technologies"],
] as const;

const toneClasses = {
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  violet: "border-violet-200 bg-violet-50 text-violet-800",
  teal: "border-teal-200 bg-teal-50 text-teal-800",
};

export default function WebsiteGuideContent({
  defaultExpanded = false,
  collapsible = true,
  showFooterText = true,
}: WebsiteGuideContentProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isOpen = collapsible ? isExpanded : true;

  return (
    <div className="mx-auto mb-10 w-full max-w-7xl px-4">
      <section className="overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl">
        <button
          type="button"
          onClick={() => collapsible && setIsExpanded((current) => !current)}
          disabled={!collapsible}
          aria-expanded={collapsible ? isOpen : undefined}
          className={`relative w-full overflow-hidden bg-linear-to-br from-slate-50 via-white to-blue-50 px-6 py-10 text-center md:px-12 md:py-14 ${
            collapsible ? "cursor-pointer" : "cursor-default"
          }`}
          title={
            collapsible
              ? isOpen
                ? "Collapse user guide"
                : "Expand user guide"
              : undefined
          }
        >
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 size-64 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="relative mx-auto max-w-4xl">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 shadow-sm">
              <Stethoscope className="size-9" aria-hidden="true" />
            </div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-semcmeBlue">
              User Guide &amp; Demo
            </p>
            <h2 className="text-3xl font-bold leading-tight text-slate-950 md:text-5xl">
              Improving EHR Use for Better Outcomes
            </h2>
            <p className="mt-4 text-xl font-semibold text-semcmeBlue md:text-2xl">
              Better Documentation. Better Data. Better Care.
            </p>
            {collapsible && (
              <span className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-semcmeBlue shadow-sm">
                {isOpen ? "Show less" : "Explore the user guide"}
                <ChevronDown
                  className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </span>
            )}
          </div>
        </button>

        <div className={isOpen ? "block" : "hidden"}>
          <div className="space-y-20 px-5 py-12 md:px-10 lg:px-14 lg:py-16">
            <section className="mx-auto max-w-5xl">
              <div className="grid gap-5 md:grid-cols-3">
                <p className="rounded-2xl border border-slate-200 bg-slate-50 p-6 leading-relaxed text-slate-700 md:col-span-2">
                  Electronic health records are central to nearly every aspect
                  of clinical care. The quality of information entered into the
                  EHR directly affects communication, patient safety, quality
                  measurement, care coordination, reimbursement, and clinical
                  decision-making.
                </p>
                <div className="flex items-center justify-center rounded-2xl bg-semcmeBlue p-7 text-white">
                  <HeartPulse
                    className="size-16 text-blue-100"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <p className="rounded-2xl border border-blue-100 bg-blue-50 p-6 leading-relaxed text-slate-700">
                  Improving EHR Use for Better Outcomes is a comprehensive
                  educational curriculum designed for medical students,
                  residents, fellows, practicing physicians, nurses, faculty,
                  and other healthcare professionals.
                </p>
                <p className="rounded-2xl border border-orange-100 bg-orange-50 p-6 leading-relaxed text-slate-700">
                  Through interactive, case-based learning, participants
                  strengthen documentation skills, improve workflow efficiency,
                  and better understand how high-quality EHR data contributes to
                  improved patient care and outcomes.
                </p>
              </div>
            </section>

            <section>
              <GuideSectionHeading
                icon={Sparkles}
                title="One Curriculum. Every Stage of Learning."
              />
              <div className="grid gap-5 lg:grid-cols-3">
                {pathwayDetails.map((pathway) => {
                  const Icon = pathway.icon;
                  return (
                    <article
                      key={pathway.number}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
                    >
                      <div
                        className={`bg-linear-to-br ${pathway.gradient} p-6 text-white`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-4xl font-black text-white/30">
                            {pathway.number}
                          </span>
                          <Icon className="size-8" aria-hidden="true" />
                        </div>
                        <h3 className="mt-3 text-xl font-bold">
                          {pathway.label}
                        </h3>
                        <p className="mt-2 text-sm font-semibold text-white/85">
                          {pathway.audience}
                        </p>
                      </div>
                      <div className="p-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Key Focus
                        </p>
                        <p className="mt-2 leading-relaxed text-slate-700">
                          {pathway.focus}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              {pathwayDetails.map((pathway) => {
                const Icon = pathway.icon;
                return (
                  <article
                    key={pathway.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-white text-semcmeBlue shadow-sm">
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <h3 className="font-bold text-slate-900">
                        {pathway.title}
                      </h3>
                    </div>
                    <p className="mt-4 font-semibold leading-relaxed text-slate-700">
                      {pathway.lead}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      {pathway.points.map((point) => (
                        <li key={point} className="flex gap-2">
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-teal-600"
                            aria-hidden="true"
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </section>

            <section>
              <GuideSectionHeading
                icon={Users}
                title="Designed for Learners — Built for Educators"
                description="The curriculum supports both individual learners and those responsible for designing and delivering medical education."
              />
              <div className="mx-auto max-w-5xl rounded-3xl bg-slate-900 p-7 text-white md:p-10">
                <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-orange-300">
                  For Educators &amp; Organizations
                </p>
                <p className="mt-3 text-center text-xl font-semibold">
                  Faculty • Program Directors • Residency Leaders • Instructors
                  • Healthcare Organizations
                </p>
                <p className="mt-8 text-lg font-bold">Each module includes:</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    "Clear learning objectives",
                    "Key concepts",
                    "Practical educational content",
                    "Guidance for curricular integration",
                    "Flexible implementation across UME, GME, and CME",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-white/10 p-4 text-sm font-semibold leading-relaxed"
                    >
                      <Check
                        className="mb-2 size-5 text-teal-300"
                        aria-hidden="true"
                      />
                      {item}
                    </div>
                  ))}
                </div>
                <p className="mt-7 leading-relaxed text-slate-200">
                  Modules can be selected according to learner level,
                  educational goals, or institutional priorities, making the
                  curriculum easy to integrate into existing educational
                  programs.
                </p>
              </div>
            </section>

            <section>
              <GuideSectionHeading
                icon={MonitorPlay}
                title="What Learners Can Do"
              />
              <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {learnerFeatures.map(([Icon, text]) => (
                  <div
                    key={text}
                    className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-semcmeBlue">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <p className="pt-1 font-semibold leading-relaxed text-slate-700">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <GuideSectionHeading
                icon={BookOpenCheck}
                title="18 Modules Across the Learning Continuum"
              />
              <div className="grid gap-6 lg:grid-cols-3">
                {moduleGroups.map((group, groupIndex) => {
                  const Icon = group.icon;
                  const priorCount = moduleGroups
                    .slice(0, groupIndex)
                    .reduce((total, item) => total + item.modules.length, 0);
                  return (
                    <article
                      key={group.title}
                      className={`rounded-2xl border p-6 ${toneClasses[group.tone]}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                          <Icon className="size-5" aria-hidden="true" />
                        </div>
                        <h3 className="font-bold leading-tight">
                          {group.title}
                        </h3>
                      </div>
                      <ol className="mt-5 space-y-3 text-sm text-slate-700">
                        {group.modules.map((module, index) => (
                          <li key={module} className="flex gap-3">
                            <span className="font-black text-slate-400">
                              {String(priorCount + index + 1).padStart(2, "0")}
                            </span>
                            <span className="leading-relaxed">{module}</span>
                          </li>
                        ))}
                      </ol>
                    </article>
                  );
                })}
              </div>
            </section>

            <section>
              <GuideSectionHeading
                icon={Star}
                title="Why EHR Education Matters"
                description="High-quality documentation is more than a clinical record. It is the foundation for better communication, safer care, stronger data, and better outcomes."
              />
              <div className="mx-auto max-w-5xl">
                <h3 className="text-center text-xl font-bold text-slate-900">
                  Better EHR Documentation Helps…
                </h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {documentationBenefits.map(([Icon, text]) => (
                    <div
                      key={text}
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <Icon
                        className="size-6 shrink-0 text-semcmeBlue"
                        aria-hidden="true"
                      />
                      <p className="font-semibold leading-relaxed text-slate-700">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-7 rounded-2xl bg-blue-100 p-5 text-center text-lg font-bold text-semcmeBlue">
                  Better information in the EHR creates better information for
                  everyone who depends on it.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-orange-200 bg-orange-50 p-7 md:p-10">
              <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
                <div className="flex size-20 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  <MonitorPlay className="size-10" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-700">
                    Explore the Educator Demo
                  </p>
                  <h2 className="mt-1 text-3xl font-bold text-slate-900">
                    See the Curriculum in Action
                  </h2>
                  <p className="mt-4 leading-relaxed text-slate-700">
                    The Educator Demo Site provides a sample of selected modules
                    and allows educators and organizations to preview:
                  </p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                      "Module content",
                      "Learning activities",
                      "Case-based exercises",
                      "Educational design",
                      "The learner experience",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm"
                      >
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-teal-600"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {showFooterText && (
              <section className="overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 to-semcmeBlue p-8 text-center text-white shadow-xl md:p-12">
                <Mail
                  className="mx-auto size-10 text-blue-100"
                  aria-hidden="true"
                />
                <h2 className="mt-4 text-3xl font-bold">
                  Ready to Learn More?
                </h2>
                <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-blue-50">
                  Bring Improving EHR Use for Better Outcomes to your learners,
                  institution, or healthcare organization.
                </p>
                <p className="mx-auto mt-3 max-w-3xl text-blue-100">
                  For information about the complete series, institutional
                  subscriptions, or implementation options:
                </p>
                <a
                  href="mailto:njuzych@semcme.org"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-bold text-semcmeBlue shadow-sm transition hover:bg-blue-50"
                  title="Email SEMCME"
                >
                  Contact SEMCME
                  <Mail className="size-4" aria-hidden="true" />
                  njuzych@semcme.org
                </a>
                <div className="mx-auto mt-8 max-w-3xl border-t border-white/20 pt-6">
                  <p className="text-xl font-bold">
                    Better documentation starts with better education.
                  </p>
                  <p className="mt-2 text-blue-100">
                    Help learners document more effectively, use the EHR more
                    efficiently, and turn better data into better care.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
