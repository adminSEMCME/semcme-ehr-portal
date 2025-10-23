import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ===========================
   MODULE DATA
   =========================== */
const cmeModules = [
  {
    id: "mod1",
    title: "Introduction to EHR Systems",
    description:
      "Learn the fundamentals of Electronic Health Records and their impact on patient care.",
    image: "/images/ehr_intro.jpg",
  },
  {
    id: "mod2",
    title: "Data Privacy & Security",
    description:
      "Understand HIPAA compliance and how to protect patient information in digital environments.",
    image: "/images/security.jpg",
  },
];

const nonCmeModules = [
  {
    id: "mod3",
    title: "Clinical Documentation Best Practices",
    description:
      "Improve documentation accuracy and workflow efficiency within EHR systems.",
    image: "/images/documentation.jpg",
  },
  {
    id: "mod4",
    title: "EHR Optimization & Workflow",
    description:
      "Explore strategies for maximizing efficiency and usability within EHR platforms.",
    image: "/images/workflow.jpg",
  },
];

/* ===========================
   MAIN PAGE
   =========================== */
export default function HomePage() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* HERO SECTION */}
      <section className="w-full text-white py-16 text-center bg-semcmeBlue">
        <h1 className="text-5xl font-bold mb-4">EHR Learning Portal</h1>
        <p className="max-w-2xl mx-auto mb-8 text-md">
          Explore modules designed to improve your knowledge
          <br />
          and application of Electronic Health Records.
        </p>

        <div className="mt-8 flex justify-center gap-8">
          {/* Sign In Button */}
          <Link href="/login">
            <button className="min-w-[200px] px-8 py-3 rounded-xl bg-white text-semcmeBlue font-semibold text-lg shadow-md border-2 border-white hover:bg-[#e6eef6] hover:scale-105 hover:shadow-lg transition-all duration-300">
              Sign In
            </button>
          </Link>

          {/* Register Button */}
          <Link href="/register/choose">
            <button className="min-w-[200px] px-8 py-3 rounded-xl bg-transparent text-white font-semibold text-lg border-2 border-white hover:bg-white hover:text-semcmeBlue hover:scale-105 hover:shadow-lg transition-all duration-300">
              Register
            </button>
          </Link>
        </div>
      </section>

      {/* MODULES SECTION */}
      <section className="w-full max-w-5xl py-16 px-4 font-sans">
        <h2 className="text-3xl font-semibold mb-10 text-semcmeBlue text-center">
          Explore Modules
        </h2>

        <Accordion type="single" collapsible className="space-y-6">
          {/* CME MODULES WRAPPER */}
          <AccordionItem
            value="cme"
            className="border border-gray-200 rounded-2xl shadow-sm bg-white"
          >
            <AccordionTrigger className="bg-semcmeBlue text-white text-2xl font-semibold px-6 py-4 rounded-t-2xl hover:bg-[#034f8c] transition-all">
              CME Modules
            </AccordionTrigger>
            <AccordionContent className="p-6 space-y-4 bg-gray-50 rounded-b-2xl">
              <Accordion type="single" collapsible className="space-y-4">
                {cmeModules.map((mod) => (
                  <AccordionItem
                    key={mod.id}
                    value={mod.id}
                    className="border border-gray-200 rounded-xl bg-white shadow-sm"
                  >
                    <AccordionTrigger className="flex items-center justify-between p-4 text-left font-semibold text-lg bg-semcmeBlue text-white rounded-t-xl hover:bg-[#034f8c] transition-all duration-200">
                      <div className="flex items-center w-full gap-6">
                        <div className="w-1/3">
                          <Image
                            src={mod.image}
                            alt={mod.title}
                            width={300}
                            height={160}
                            className="rounded-lg object-cover w-full h-32 md:h-40 lg:h-44"
                          />
                        </div>
                        <div className="w-2/3 flex justify-center">
                          <span className="text-xl md:text-xl font-semibold text-center w-full">
                            {mod.title}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>

                    {/* Replaced Learn More → Register CTA */}
                    <AccordionContent className="p-6 bg-white border-t border-gray-200 text-semcmeBlue leading-relaxed">
                      <p className="mb-4">{mod.description}</p>
                      <Link href="/register?msg=register-required">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-semcmeBlue text-semcmeBlue hover:bg-semcmeBlue hover:text-white transition-all"
                        >
                          Register to Access
                        </Button>
                      </Link>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>

          {/* NON-CME MODULES WRAPPER */}
          <AccordionItem
            value="noncme"
            className="border border-gray-200 rounded-2xl shadow-sm bg-white"
          >
            <AccordionTrigger className="bg-semcmeBlue text-white text-2xl font-semibold px-6 py-4 rounded-t-2xl hover:bg-[#034f8c] transition-all">
              Non-CME Modules
            </AccordionTrigger>
            <AccordionContent className="p-6 space-y-4 bg-gray-50 rounded-b-2xl">
              <Accordion type="single" collapsible className="space-y-4">
                {nonCmeModules.map((mod) => (
                  <AccordionItem
                    key={mod.id}
                    value={mod.id}
                    className="border border-gray-200 rounded-xl bg-white shadow-sm"
                  >
                    <AccordionTrigger className="flex items-center justify-between p-4 text-left font-semibold text-lg bg-semcmeBlue text-white rounded-t-xl hover:bg-[#034f8c] transition-all duration-200">
                      <div className="flex items-center w-full gap-6">
                        <div className="w-1/3">
                          <Image
                            src={mod.image}
                            alt={mod.title}
                            width={300}
                            height={160}
                            className="rounded-lg object-cover w-full h-32 md:h-40 lg:h-44"
                          />
                        </div>
                        <div className="w-2/3 flex justify-center">
                          <span className="text-xl md:text-xl font-semibold text-center w-full">
                            {mod.title}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>

                    {/* Replaced Learn More → Register CTA */}
                    <AccordionContent className="p-6 bg-white border-t border-gray-200 text-semcmeBlue leading-relaxed">
                      <p className="mb-4">{mod.description}</p>
                      <Link href="/register?msg=register-required">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-semcmeBlue text-semcmeBlue hover:bg-semcmeBlue hover:text-white transition-all"
                        >
                          Register to Access
                        </Button>
                      </Link>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </main>
  );
}
