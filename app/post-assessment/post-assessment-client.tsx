// app/post-assessment/post-assessment-client.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

type Responses = {
  relevance: string;
  design: string;
  teaching: string;
  utility: string;
  confidence: string;
  preparedness: string;
};

export default function PostAssessmentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module_id");

  const [responses, setResponses] = useState<Responses>({
    relevance: "",
    design: "",
    teaching: "",
    utility: "",
    confidence: "",
    preparedness: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!moduleId) {
      router.push("/dashboards");
    }
  }, [moduleId, router]);

  const handleChange = (key: keyof Responses, value: string) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const requiredFields: (keyof Responses)[] = [
      "relevance",
      "design",
      "teaching",
      "utility",
      "confidence",
      "preparedness",
    ];

    const hasMissing = requiredFields.some(
      (field) => !responses[field]?.trim(),
    );

    if (hasMissing) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user || !moduleId) {
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("post_assessments").insert({
      user_id: user.id,
      module_id: moduleId,
      responses,
    });

    if (error) {
      console.error(error);
      alert("Error submitting assessment.");
      setSubmitting(false);
      return;
    }

    await fetch("/api/certificates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module_id: moduleId,
      }),
    });

    router.replace(`/dashboards?scrollTo=${moduleId}`);
  };

  return (
    <main className="min-h-screen bg-gray-100 flex justify-center px-4 py-12">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center">Post-Assessment</h1>

        <Question
          title="Please rate the module content for relevance to your learning needs."
          options={[
            "Highly relevant to my learning needs",
            "Very relevant to my learning needs",
            "Somewhat relevant to my learning needs",
            "Not very relevant to my learning needs",
            "Not at all relevant to my learning needs",
          ]}
          value={responses.relevance}
          onChange={(v) => handleChange("relevance", v)}
        />

        <Question
          title="Please rate the module design relative to your expectations for user interface and interactivity."
          options={[
            "Excellent module design with multiple features that assisted my learning",
            "Very good module design with many features that assisted my learning",
            "Good module design with some features that assisted my learning",
            "Fair module design with few features that assisted my learning",
            "Poor module design with very few features that assisted my learning",
          ]}
          value={responses.design}
          onChange={(v) => handleChange("design", v)}
        />

        <Question
          title="Please rate the module teaching methods relative to your expectations for learning."
          options={["Excellent", "Very Good", "Good", "Fair", "Poor"]}
          value={responses.teaching}
          onChange={(v) => handleChange("teaching", v)}
        />

        <Question
          title="Please rate the utility of the module content in improving your current EHR practice."
          options={[
            "Extremely useful, featuring significant content that I will apply to my current EHR methods.",
            "Very useful, featuring content that I will apply to my current EHR methods.",
            "Useful, featuring some content that I will apply to my current EHR methods.",
            "Limited utility, featuring little content that I will apply to my current EHR methods.",
            "Not at all useful, featuring no content that I will apply to my current EHR methods.",
          ]}
          value={responses.utility}
          onChange={(v) => handleChange("utility", v)}
        />

        {/* TEXT QUESTIONS — NOW FOR ALL USERS */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">
            Which aspects of this activity were most effective?
          </h2>
          <textarea
            value={responses.confidence}
            onChange={(e) => handleChange("confidence", e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-semcmeBlue"
          />
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg">
            Which aspects of this activity could be improved? (please provide
            specific suggestions)
          </h2>
          <textarea
            value={responses.preparedness}
            onChange={(e) => handleChange("preparedness", e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-semcmeBlue"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="lg"
          className="w-full font-semibold"
        >
          {submitting ? "Submitting..." : "Submit Assessment"}
        </Button>
      </div>
    </main>
  );
}

function Question({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg">{title}</h2>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="mt-1"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
