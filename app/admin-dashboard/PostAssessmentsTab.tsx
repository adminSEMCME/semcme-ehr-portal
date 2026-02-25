//app/admin-dashboard/PostAssessmentsTab.tsx
"use client";

import { useState } from "react";

export default function PostAssessmentsTab({
  assessments,
  modules,
}: {
  assessments: {
    id: string;
    module_id: string;
    responses: Record<string, string>;
    submitted_at: string;
  }[];
  modules: {
    id: string;
    title: string;
  }[];
}) {
  const moduleMap: Record<string, string> = {};

  modules.forEach((m) => {
    moduleMap[m.id] = m.title;
  });

  const [selectedModule, setSelectedModule] = useState<string>("all");

  const questionLabels: Record<string, string> = {
    relevance:
      "Please rate the module content for relevance to your learning needs.",

    design:
      "Please rate the module design relative to your expectations for user interface and interactivity.",

    teaching:
      "Please rate the module teaching methods relative to your expectations for learning.",

    utility:
      "Please rate the utility of the module content in improving your current EHR practice.",

    confidence: "Which aspects of this activity were most effective?",

    preparedness:
      "Which aspects of this activity could be improved? (please provide specific suggestions)",
  };

  const answerScales: Record<string, string[]> = {
    relevance: [
      "Highly relevant to my learning needs",
      "Very relevant to my learning needs",
      "Somewhat relevant to my learning needs",
      "Not very relevant to my learning needs",
      "Not at all relevant to my learning needs",
    ],

    design: [
      "Excellent module design with multiple features that assisted my learning",
      "Very good module design with many features that assisted my learning",
      "Good module design with some features that assisted my learning",
      "Fair module design with few features that assisted my learning",
      "Poor module design with very few features that assisted my learning",
    ],

    teaching: ["Excellent", "Very Good", "Good", "Fair", "Poor"],

    utility: [
      "Extremely useful, featuring significant content that I will apply to my current EHR methods.",
      "Very useful, featuring content that I will apply to my current EHR methods.",
      "Useful, featuring some content that I will apply to my current EHR methods.",
      "Limited utility, featuring little content that I will apply to my current EHR methods.",
      "Not at all useful, featuring no content that I will apply to my current EHR methods.",
    ],
  };

  if (!assessments || assessments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No post assessment submissions yet.
      </div>
    );
  }

  // Group by module_id
  const grouped: Record<
    string,
    {
      submissions: typeof assessments;
      totals: Record<string, Record<string, number>>;
    }
  > = {};

  assessments.forEach((entry) => {
    const moduleKey = moduleMap[entry.module_id] ?? entry.module_id;

    if (!grouped[moduleKey]) {
      grouped[moduleKey] = {
        submissions: [],
        totals: {},
      };
    }

    grouped[moduleKey].submissions.push(entry);

    Object.entries(entry.responses || {}).forEach(([question, answer]) => {
      if (!grouped[moduleKey].totals[question]) {
        grouped[moduleKey].totals[question] = {};
      }

      if (!grouped[moduleKey].totals[question][answer]) {
        grouped[moduleKey].totals[question][answer] = 0;
      }

      grouped[moduleKey].totals[question][answer]++;
    });
  });

  const moduleEntries = Object.entries(grouped);

  return (
    <div className="space-y-12">
      {/* ===== MODULE FILTER ===== */}
      <div className="flex justify-center">
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Modules</option>
          {moduleEntries.map(([moduleName]) => (
            <option key={moduleName} value={moduleName}>
              {moduleName}
            </option>
          ))}
        </select>
      </div>

      {moduleEntries
        .filter(([moduleId]) =>
          selectedModule === "all" ? true : moduleId === selectedModule,
        )
        .map(([moduleId, data]) => (
          <div
            key={moduleId}
            className="bg-white rounded-xl shadow-sm border border-gray-300 p-6"
          >
            <h2 className="text-2xl font-semibold text-semcmeBlue mb-6">
              {moduleId}
            </h2>

            {/* ================= AGGREGATED TOTALS ================= */}

            <h3 className="text-lg font-semibold mb-6">Aggregated Totals</h3>

            {/* ---- GRID FOR SCALED QUESTIONS ---- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {Object.entries(data.totals)
                .filter(([question]) =>
                  ["design", "utility", "teaching", "relevance"].includes(
                    question,
                  ),
                )
                .map(([question, answers]) => {
                  const possibleAnswers =
                    answerScales[question] ?? Object.keys(answers);

                  return (
                    <div
                      key={question}
                      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                    >
                      <h4 className="font-semibold text-semcmeBlue mb-3">
                        {questionLabels[question] ?? question}
                      </h4>

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="pb-2">Response</th>
                            <th className="pb-2 text-right">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {possibleAnswers.map((answer) => (
                            <tr
                              key={answer}
                              className="border-b last:border-none"
                            >
                              <td className="py-1 pr-4">{answer}</td>
                              <td className="py-1 pr-2 text-right font-semibold text-semcmeBlue">
                                {answers[answer] ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
            </div>

            {/* ---- FREE TEXT RESPONSES ---- */}
            <div className="space-y-10">
              {["confidence", "preparedness"].map((question) => {
                const responses = data.submissions
                  .map((s) => s.responses?.[question])
                  .filter(Boolean);

                return (
                  <div key={question}>
                    <h4 className="font-semibold text-semcmeBlue mb-4">
                      {questionLabels[question]}
                    </h4>

                    {responses.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No responses submitted.
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                        {responses.map((resp, idx) => (
                          <div key={idx} className="text-sm text-gray-700">
                            - {resp}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ================= RAW RESPONSES ================= */}

            <div className="mt-12">
              <h3 className="text-lg font-semibold mb-4 text-semcmeBlue">
                Raw Submissions
              </h3>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        {Object.keys(data.submissions[0]?.responses || {}).map(
                          (question) => (
                            <th
                              key={question}
                              className="px-4 py-3 text-left font-semibold text-gray-700"
                            >
                              {questionLabels[question] ?? question}
                            </th>
                          ),
                        )}
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Submitted
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.submissions.map((submission, index) => (
                        <tr
                          key={submission.id}
                          className={`border-t ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          {Object.entries(submission.responses || {}).map(
                            ([key, answer]) => (
                              <td key={key} className="px-4 py-3 align-top">
                                {answer}
                              </td>
                            ),
                          )}

                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {new Date(submission.submitted_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {data.submissions.length > 5 && (
                <p className="text-xs text-gray-500 mt-2">
                  Showing {data.submissions.length} submissions — scroll to view
                  more.
                </p>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
