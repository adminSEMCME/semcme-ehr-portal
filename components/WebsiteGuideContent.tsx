"use client";

import { useState } from "react";

interface WebsiteGuideContentProps {
  defaultExpanded?: boolean;
  collapsible?: boolean;
  showFooterText?: boolean;
}

export default function WebsiteGuideContent({
  defaultExpanded = false,
  collapsible = true,
  showFooterText = true,
}: WebsiteGuideContentProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isOpen = collapsible ? isExpanded : true;

  const toggleGuide = () => {
    if (collapsible) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto mb-10 px-4">
      <div className="bg-white/95 rounded-2xl shadow-lg pt-6 md:pt-8 text-gray-700 text-sm md:text-base leading-relaxed">
        {/* TITLE */}
        <div
          onClick={toggleGuide}
          onKeyDown={(e) => {
            if (!collapsible) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleGuide();
            }
          }}
          role={collapsible ? "button" : undefined}
          tabIndex={collapsible ? 0 : undefined}
          title={
            collapsible
              ? isOpen
                ? "Collapse user guide"
                : "Expand user guide"
              : undefined
          }
          aria-expanded={collapsible ? isOpen : undefined}
          className={collapsible ? "cursor-pointer rounded-md" : "rounded-md"}
        >
          <h2 className="text-xl md:text-2xl font-bold text-semcmeBlue text-center mb-2">
            Improving EHR Use for Better Outcomes: User Guide
          </h2>

          {collapsible && (
            <p className="text-center text-sm text-semcmeBlue mb-6">
              {isOpen ? "Show less ↑" : "Click to expand ↓"}
            </p>
          )}
        </div>

        {/* COLLAPSIBLE CONTENT */}
        <div
          className={`relative ${
            isOpen ? "overflow-visible" : "max-h-[120px] overflow-hidden"
          }`}
        >
          <div
            className={`transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-95"
            }`}
          >
            {/* PARAGRAPHS */}
            <div className="space-y-4 max-w-5xl mx-auto">
              <p>
                Improving Documentation for Better Outcomes educational
                curriculum is designed to help practicing physicians, faculty,
                learners, and other healthcare professionals strengthen their
                documentation skills within electronic health records (EHRs). As
                EHRs have become the central link across every area of clinical
                practice, accurate and meaningful documentation plays a critical
                role in improving patient safety, supporting quality measures,
                enhancing communication, and promoting more cost-effective care.
                By improving the quality of data entered into the EHR,
                clinicians also improve the reliability of the data used to
                guide decisions, measure outcomes, and ultimately deliver better
                patient care.
              </p>

              <p>
                This curriculum offers a continuum of learning modules tailored
                to all stages of medical education and clinical practice, from
                undergraduate medical students to residents, fellows, and
                experienced practicing clinicians. The program is organized into
                three progressive learning levels:
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
                  transitions of care, and performance measures in areas such as
                  diabetes, obesity, and social determinants of health.
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
                  Explore 18 learning modules designed to improve your knowledge
                  and application of EHRs.
                </li>
                <li>
                  Filter modules to access services designed to target different
                  learning levels.
                </li>
                <li>
                  Follow multiple case studies and complete practice exercises.
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
            <div className="mt-4 max-w-5xl mx-auto">
              <h3 className="text-lg font-semibold text-semcmeBlue text-center mb-4">
                Available Modules
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-sm">
                <ul className="space-y-1">
                  <li>
                    • Introduction to EHR Educational Series - Improving EHR Use
                    for Better Outcomes
                  </li>
                  <li>• Electronic Health Records: An Introduction</li>
                  <li>• Practicing Fundamental Skills</li>
                  <li>• The Note: Documentation in an EHR</li>
                  <li>
                    • Introduction to Coding and Billing: ICD-10, CPT, E/M Codes
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
                    • Improving Efficiency and Effectiveness in the Use of EHRs
                  </li>
                  <li>
                    • Improving Quality Metrics for Readmission, Transition of
                    Care and Medication Reconciliation (Emergency Department to
                    PCP)
                  </li>
                  <li>
                    • Improving Quality Metrics for Readmission, Transition of
                    Care and Medication Reconciliation (Hospital to PCP)
                  </li>
                  <li>
                    • Documentation of Evidence-Based Management of Obesity and
                    Performance Measures
                  </li>
                  <li>
                    • Documentation of Evidence-Based Management of Diabetes and
                    Performance Measures
                  </li>
                </ul>
              </div>
            </div>

            {showFooterText && (
              <p className="mt-4 max-w-5xl mx-auto pb-8 text-center text-gray-700 text-xs md:text-sm">
                The Educator Demo Site provides a sample of the modules for
                review. For further information, or to request information on
                subscription to the complete series of modules, please contact
                njuzych@semcme.org
              </p>
            )}
          </div>
          {!isOpen && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-white/0 to-white/95" />
          )}
        </div>
      </div>
    </div>
  );
}
