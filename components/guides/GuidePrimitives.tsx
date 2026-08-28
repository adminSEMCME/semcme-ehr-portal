import type { LucideIcon } from "lucide-react";

export function GuideSectionHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-7 max-w-3xl text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-semcmeBlue">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      {eyebrow && (
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          {description}
        </p>
      )}
    </div>
  );
}

export function IconBullet({
  icon: Icon,
  children,
  tone = "blue",
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  tone?: "blue" | "orange" | "teal" | "violet";
}) {
  const tones = {
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    teal: "bg-teal-100 text-teal-700",
    violet: "bg-violet-100 text-violet-700",
  };

  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="pt-0.5 leading-relaxed text-slate-700">{children}</span>
    </li>
  );
}
