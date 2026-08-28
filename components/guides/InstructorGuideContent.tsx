import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseMedical,
  Building2,
  Check,
  ClipboardCheck,
  GraduationCap,
  Handshake,
  HeartPulse,
  Mail,
  Presentation,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";
import { EDUCATOR_PATHS, type EducatorPathKey } from "@/lib/educatorPreview";
import { GuideSectionHeading, IconBullet } from "./GuidePrimitives";

const pathwayModules: Record<EducatorPathKey, string[]> = {
  ume: [
    "Introduction to Electronic Health Records",
    "Practicing Fundamental Skills",
    "The Note: Documentation in an EHR",
    "Introduction to Coding and Billing",
    "Order Entry and Order Sets",
    "Social Determinants of Health",
  ],
  gme: [
    "Effective Use of EHRs",
    "Mock EHR Clinical Encounter",
    "High Yield Notes",
    "Coding and Billing: Office Workflow",
    "Procedure and Visit Coding",
    "Diagnosis Coding and Billing",
    "Social Determinants of Health",
  ],
  cme: [
    "Improving Efficiency and Effectiveness in the Use of EHRs",
    "Transitions of Care: Hospital to PCP",
    "Transitions of Care: Emergency Room to PCP",
    "Obesity Documentation and Measures",
    "Diabetes Documentation and Measures",
    "Social Determinants of Health",
  ],
};

const pathwayIcons = {
  ume: GraduationCap,
  gme: Stethoscope,
  cme: BriefcaseMedical,
};

const implementationOptions = [
  [BookOpenCheck, "longitudinal learning series"],
  [GraduationCap, "clerkship integration"],
  [Presentation, "resident bootcamps"],
  [Users, "faculty development"],
  [ClipboardCheck, "quality improvement initiatives"],
  [HeartPulse, "point-of-care refreshers"],
] as const;

export default function InstructorGuideContent() {
  return (
    <div className="w-full max-w-7xl px-4 pb-4">
      <section className="overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-linear-to-br from-slate-50 via-white to-blue-50 px-6 py-12 text-center md:px-12 md:py-16">
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 size-64 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="relative mx-auto max-w-4xl">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 shadow-sm">
              <Stethoscope className="size-9" aria-hidden="true" />
            </div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-semcmeBlue">
              Information for Faculty and Instructors
            </p>
            <h1 className="text-3xl font-bold leading-tight text-slate-950 md:text-5xl">
              Improving Documentation for Better Outcomes
            </h1>
            <p className="mt-4 text-xl font-semibold text-semcmeBlue md:text-2xl">
              Transforming EHR Documentation Across the Continuum of Medical
              Education
            </p>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
              A comprehensive learning program for students, residents,
              fellows, faculty, nurses, and practicing clinicians designed to
              strengthen documentation practices that lead to safer care,
              better outcomes, and improved quality performance.
            </p>
          </div>
        </div>

        <div className="space-y-20 px-5 py-12 md:px-10 lg:px-14 lg:py-16">
          <section>
            <GuideSectionHeading icon={Star} title="Why This Program Matters" />
            <div className="mx-auto grid max-w-5xl gap-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
              <div>
                <p className="text-lg leading-relaxed text-slate-700">
                  Electronic health records are central to modern patient care.
                  The quality of documentation directly influences:
                </p>
                <ul className="mt-5 space-y-3">
                  <IconBullet icon={HeartPulse}>clinical decision-making</IconBullet>
                  <IconBullet icon={ShieldCheck}>patient safety</IconBullet>
                  <IconBullet icon={Handshake}>care transitions</IconBullet>
                  <IconBullet icon={ClipboardCheck}>coding and billing accuracy</IconBullet>
                  <IconBullet icon={Award}>quality metrics and value-based care</IconBullet>
                </ul>
              </div>
              <div className="flex items-center rounded-2xl bg-semcmeBlue p-7 text-white shadow-lg">
                <p className="text-lg font-semibold leading-relaxed">
                  This curriculum helps learners at every stage build the
                  knowledge and habits needed to document clearly, accurately,
                  and efficiently.
                </p>
              </div>
            </div>
          </section>

          <section>
            <GuideSectionHeading
              icon={Sparkles}
              title="Choose Your Learning Pathway"
              description="Select a pathway to review its featured modules and open the complete educator preview."
            />
            <div className="grid gap-6 lg:grid-cols-3">
              {(["ume", "gme", "cme"] as EducatorPathKey[]).map((pathKey) => {
                const path = EDUCATOR_PATHS[pathKey];
                const PathIcon = pathwayIcons[pathKey];

                return (
                  <article
                    key={pathKey}
                    className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-transform duration-200 hover:-translate-y-1"
                  >
                    <div className="flex w-full flex-col">
                      <div className={`bg-linear-to-br ${path.accent} p-6 text-white`}>
                        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-white/15">
                          <PathIcon className="size-6" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-bold tracking-[0.18em]">
                          {path.label}
                        </p>
                        <h3 className="mt-1 text-2xl font-bold">{path.title}</h3>
                        <p className="mt-2 text-sm font-semibold text-white/90">
                          {path.audience}
                        </p>
                      </div>
                      <div className="flex grow flex-col p-6">
                        <p className="leading-relaxed text-slate-600">{path.summary}</p>
                        <p className="mt-5 text-sm font-bold uppercase tracking-wider text-slate-900">
                          Featured modules
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {pathwayModules[pathKey].map((module) => (
                            <li key={module} className="flex gap-2">
                              <Check className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
                              <span>{module}</span>
                            </li>
                          ))}
                        </ul>
                        <Link
                          href={`/educator-preview/${pathKey}`}
                          className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-semcmeBlue px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
                          title={`Explore ${path.label} modules`}
                        >
                          Explore {path.label} Modules
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-7 md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <Award className="size-6" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Continuing Education Credit
                </h2>
              </div>
              <p className="mt-5 text-lg text-slate-700">
                Most modules offer continuing education credit for:
              </p>
              <ul className="mt-4 space-y-3">
                <IconBullet icon={Stethoscope} tone="orange">
                  Practicing Physicians/Faculty
                </IconBullet>
                <IconBullet icon={HeartPulse} tone="orange">Nurse</IconBullet>
              </ul>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-7 md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Presentation className="size-6" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  For Educators and Program Leaders
                </h2>
              </div>
              <p className="mt-5 text-lg text-slate-700">
                This curriculum can be implemented as:
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {implementationOptions.map(([Icon, label]) => (
                  <div key={label} className="rounded-xl bg-white p-3 shadow-sm">
                    <Icon className="mb-2 size-5 text-violet-700" aria-hidden="true" />
                    <p className="text-sm font-semibold leading-snug text-slate-700">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-slate-900 p-7 text-white md:p-10">
            <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
              <div className="flex size-20 items-center justify-center rounded-2xl bg-white/10 text-orange-300">
                <Handshake className="size-10" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Collaborative Excellence</h2>
                <p className="mt-3 leading-relaxed text-slate-200">
                  Developed through collaboration among specialists in health
                  informatics, medical education, evaluation science, and
                  billing/coding, this curriculum supports the mission of
                  improving patient care through better documentation.
                </p>
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  <Building2 className="size-4" aria-hidden="true" />
                  Supported by the Blue Cross Blue Shield of Michigan Value
                  Partnerships Program
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-blue-950 to-[#02519c] p-8 text-center text-white shadow-xl md:p-12">
            <Mail className="mx-auto size-10 text-blue-100" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-bold">Ready to Learn More?</h2>
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
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-100 px-6 py-3 font-bold text-blue-950 shadow-sm transition hover:bg-blue-200"
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
        </div>
      </section>
    </div>
  );
}
