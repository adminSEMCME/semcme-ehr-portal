export type EducatorPathKey = "ume" | "gme" | "cme";

export interface PreviewModule {
  id: string;
  title: string;
  description?: string | null;
  objective_description?: string | null;
  url: string;
  order_index?: number | null;
  skill_level?: string | null;
}

export const EDUCATOR_PATHS: Record<
  EducatorPathKey,
  {
    label: string;
    title: string;
    audience: string;
    summary: string;
    levels: string[];
    accent: string;
    order: string[];
  }
> = {
  ume: {
    label: "UME",
    title: "Fundamental Concepts",
    audience: "For medical students and early learners",
    summary:
      "Build confidence with the foundations of EHR navigation, note writing, coding basics, and order entry.",
    levels: ["novice", "all"],
    accent: "from-sky-600 to-blue-800",
    order: [
      "Introduction to EHR Educational Series",
      "Electronic Health Records: An Introduction",
      "Practicing Fundamental Skills",
      "The Note: Documentation in an EHR",
      "Introduction to Coding and Billing: ICD-10, CPT, E/M Codes",
      "Order Entry and Order Sets",
      "Documenting Social Determinants of Health",
    ],
  },
  gme: {
    label: "GME",
    title: "Intermediate Level",
    audience: "For residents and fellows",
    summary:
      "Develop documentation skills for workflow efficiency, accurate coding, and independent clinical practice.",
    levels: ["intermediate", "all"],
    accent: "from-violet-600 to-indigo-800",
    order: [
      "Introduction to EHR Educational Series",
      "Effective Use of EHRs",
      "Mock EHR Clinical Encounter",
      "High Yield Notes",
      "Coding and Billing: Office Workflow",
      "Medical Procedure and Visit Coding",
      "Diagnosis Coding and Billing: ICD-10 and How to Build a Diagnosis",
      "Documenting Social Determinants of Health",
    ],
  },
  cme: {
    label: "CME",
    title: "Advanced Learners",
    audience: "For practicing clinicians and faculty",
    summary:
      "Refine documentation strategies to improve transitions of care, chronic disease performance measures, and quality reporting.",
    levels: ["advanced", "all"],
    accent: "from-teal-600 to-cyan-800",
    order: [
      "Introduction to EHR Educational Series",
      "Improving Efficiency and Effectiveness in the Use of EHRs",
      "Improving Quality Metrics for Transitions of Care: From Hospital to PCP",
      "Improving Quality Metrics for Transitions of Care: From Emergency Room to Primary Care",
      "Documenting Evidence Based Management of Obesity and Performance Measures",
      "Documenting Evidence Based Management of Diabetes and Performance Measures",
      "Documenting Social Determinants of Health",
    ],
  },
};

export const EDUCATOR_PATH_KEYS = Object.keys(
  EDUCATOR_PATHS,
) as EducatorPathKey[];

const getSkillLevels = (skillLevel?: string | null) =>
  (skillLevel || "")
    .split(",")
    .map((level) => level.trim().toLowerCase())
    .filter(Boolean);

export function isEducatorPathKey(value: string): value is EducatorPathKey {
  return value in EDUCATOR_PATHS;
}

export function getModulesForPath(
  modules: PreviewModule[],
  path: EducatorPathKey,
) {
  const config = EDUCATOR_PATHS[path];

  return modules
    .filter((module) => {
      const levels = getSkillLevels(module.skill_level);
      return config.levels.some((level) => levels.includes(level));
    })
    .sort((a, b) => {
      const aIndex = config.order.indexOf(a.title);
      const bIndex = config.order.indexOf(b.title);

      if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
      if (aIndex >= 0) return -1;
      if (bIndex >= 0) return 1;
      return (a.order_index ?? 0) - (b.order_index ?? 0);
    });
}

export function getPreviewUrl(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}preview=1`;
}
