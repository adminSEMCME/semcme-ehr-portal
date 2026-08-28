import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  Eye,
  GraduationCap,
  Info,
  ShieldCheck,
  Stethoscope,
  BriefcaseMedical,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import EducatorPreviewGrid from "@/components/educator/EducatorPreviewGrid";
import { createClient } from "@/lib/supabaseServer";
import {
  EDUCATOR_PATH_KEYS,
  EDUCATOR_PATHS,
  getModulesForPath,
  isEducatorPathKey,
  type EducatorPathKey,
  type PreviewModule,
} from "@/lib/educatorPreview";

const pathIcons = {
  ume: GraduationCap,
  gme: Stethoscope,
  cme: BriefcaseMedical,
};

export function generateStaticParams() {
  return EDUCATOR_PATH_KEYS.map((path) => ({ path }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path: string }>;
}): Promise<Metadata> {
  const { path } = await params;

  if (!isEducatorPathKey(path)) return {};

  return {
    title: `${EDUCATOR_PATHS[path].label} Educator Preview | SEMCME`,
    description: `Preview the ${EDUCATOR_PATHS[path].label} EHR learning modules for educators and program leaders.`,
  };
}

export default async function EducatorPreviewPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path: requestedPath } = await params;

  if (!isEducatorPathKey(requestedPath)) notFound();

  const path = requestedPath as EducatorPathKey;
  const config = EDUCATOR_PATHS[path];
  const PathIcon = pathIcons[path];
  const supabase = await createClient();
  const { data } = await supabase
    .from("modules")
    .select(
      "id, title, description, objective_description, url, order_index, skill_level",
    )
    .order("order_index", { ascending: true });
  const modules = getModulesForPath((data || []) as PreviewModule[], path);

  return (
    <>
      <main className="min-h-screen pb-20 font-sans">
        <AppHeader action="back" />

        <div className="mx-auto w-full max-w-7xl px-4 pt-4">
          <section
            className={`overflow-hidden rounded-3xl bg-linear-to-br ${config.accent} px-6 py-10 text-white shadow-2xl md:px-10 md:py-12`}
          >
            <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
              <div className="flex size-20 items-center justify-center rounded-2xl bg-white/15">
                <PathIcon className="size-10" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
                  Educator Preview • {config.label}
                </p>
                <h1 className="mt-2 text-3xl font-bold md:text-5xl">
                  {config.title}
                </h1>
                <p className="mt-3 text-lg font-semibold text-white/90">
                  {config.audience}
                </p>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/85 md:text-lg">
                  {config.summary}
                </p>
              </div>
            </div>
          </section>

          <section className="my-7 grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <Eye className="mt-0.5 size-5 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <h2 className="font-bold text-slate-900">Full module review</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Open module content directly in a separate browser tab.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-5">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden="true" />
              <div>
                <h2 className="font-bold text-slate-900">No learner tracking</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Progress, assessments, certificates, and CE credit are not recorded.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <Info className="mt-0.5 size-5 shrink-0 text-orange-700" aria-hidden="true" />
              <div>
                <h2 className="font-bold text-slate-900">Educator access</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  This preview does not represent an enrolled learner account.
                </p>
              </div>
            </div>
          </section>

          <nav
            aria-label="Educator preview pathways"
            className="mb-8 flex flex-wrap items-center justify-center gap-3"
          >
            {EDUCATOR_PATH_KEYS.map((pathKey) => (
              <Link
                key={pathKey}
                href={`/educator-preview/${pathKey}`}
                aria-current={pathKey === path ? "page" : undefined}
                className={`rounded-full px-5 py-2 text-sm font-bold shadow-sm transition ${
                  pathKey === path
                    ? "bg-slate-900 text-white"
                    : "bg-white text-semcmeBlue hover:bg-blue-50"
                }`}
              >
                {EDUCATOR_PATHS[pathKey].label} Preview
              </Link>
            ))}
          </nav>

          <div className="mb-6 flex items-center gap-3 text-white">
            <BookOpenCheck className="size-7" aria-hidden="true" />
            <h2 className="text-2xl font-bold md:text-3xl">
              Explore {config.label} Modules
            </h2>
          </div>

          <EducatorPreviewGrid modules={modules} />

          <div className="mt-10 flex justify-center">
            <Link
              href="/instructor-guide"
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-bold text-semcmeBlue shadow-sm transition hover:bg-blue-50"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Return to Educator Information
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
