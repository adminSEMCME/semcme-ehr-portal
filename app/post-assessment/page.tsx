// app/post-assessment/page.tsx
"use client";

import { Suspense } from "react";
import PostAssessmentClient from "./post-assessment-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <PostAssessmentClient />
    </Suspense>
  );
}
