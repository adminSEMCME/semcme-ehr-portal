"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Author {
  name: string;
  title: string;
  organization?: string;
  bio: string;
}

const AUTHORS = [
  {
    name: "Nelia Afonso, MBBS, MD, MRCP",
    title: "Professor - Foundational Medical Studies",
    organization: "Oakland University William Beaumont School of Medicine",
    bio: `Dr. Afonso received her M.B.B.S. and M.D. degrees from the University of Mumbai in India and received her M.R.C.P. degree from the Royal College of Physicians in the United Kingdom.

    She is a professor in the Department of Foundational Medical Studies at the Oakland University William Beaumont School of Medicine (OUWB) and a founding faculty member of the institution. In June 2024, she was awarded the distinguished title of Dean's Distinguished Professor in recognition of her achievements in teaching, scholarship, and service. Dr. Afonso is widely regarded for her contributions to medical education, particularly in curriculum development and innovation, including her work on the Art and Practice of Medicine course. Her scholarly efforts span medical education, clinical skills, women's health, and vaccine hesitancy, and she has served as principal investigator on externally funded research such as the Merck-supported project “Promoting Vaccine Confidence in Medical and Dental Students.” In addition to her academic accomplishments, Dr. Afonso has demonstrated a strong commitment to community engagement and professional service, including leadership roles with organizations like the Southeast Michigan Center for Medical Education. Her career reflects a sustained dedication to advancing medical education, fostering student development, and improving community health outcomes.`,
  },

  {
    name: "Leland Babitch, MD, MBA",
    title: "President and Chief Executive Officer",
    organization: "IMPROve Health",
    bio: `Dr. Babitch, is the President and CEO of IMPROve Health, a healthcare quality improvement organization with nation-wide activity. With more than twenty-five years of experience in healthcare, Dr. Babitch brings a demonstrated expertise in quality improvement, electronic health record technology, health information exchange, population health, and hospital/medical group governance. 

    Prior to joining iMPROve Health, Dr. Babitch served as an Executive Medical Director with The Advisory Board Company, a division of Optum. Additionally, he has served as a Senior Vice President and Chief Medical Information Officer at the Detroit Medical Center. There, his guidance and leadership contributed to the health system's success in reaching Healthcare Information and Management Systems Society Stage 6, realizing more than $32 million in Meaningful Use incentives, as well as a $16 million Beacon award. 

    Dr. Babitch has also worked as a Medical Director for United Healthcare. At the Wayne State University School of Medicine and the Detroit Medical Center, Dr. Babitch served in many roles including as the Director of Ambulatory and Information Services for Children's Hospital of Michigan, as well as the Chief Compliance Officer for University Pediatricians. He continues to practice clinically and teach as an Assistant Professor at the Central Michigan University School of Medicine in the Department of Pediatrics. 

    Dr. Babitch holds a Doctor of Medicine degree from Wayne State University School of Medicine, a Master of Business Administration from Michigan State University, and a Bachelor of Arts in genetics and developmental biology from Northwestern University. He is a Certified Medical Practice Executive, and a Fellow of the American College of Healthcare Executives. Dr. Babitch is board certified in Pediatrics as well as Medical Informatics.`,
  },

  {
    name: "Michael Barnes, MD",
    title: "Medical Director for Quality, Safety, and Medical Affairs",
    organization: "Trinity Health Oakland Hospital",
    bio: `Mike Barnes is currently the Medical Director for Quality, Safety, and Medical Affairs at Trinity Health Oakland Hospital. He attended Wayne State University School of Medicine and completed his Internal Medicine Residency and Chief Residency at Corewell Health - Royal Oak. His interests and background experiences include medical education, medical informatics, patient experience, process improvement and faculty development.`,
  },

  {
    name: "Nikhil Goyal, MD",
    title: "Physician",
    organization: "Henry Ford Health System",
    bio: `Dr. Goyal is board certified in Emergency Medicine, Internal Medicine and Clinical Informatics. He received his medical degree from Maulana Azad Medical College in India and completed his residency in Emergency Medicine and Internal Medicine at Henry Ford Hospital in Detroit, Michigan. Dr. Goyal was until recently the Director of Medical Education for Henry Ford Wyandotte Hospital, and he has served on various committees of the ACGME and the board of directors of the National Resident Matching Program. He has received multiple awards including the Distinguished Section Editor award from the Western Journal of Emergency Medicine (2019), “Top Docs” Emergency Medicine Listing, Hour Magazine (2012-2024), and Roger F. Smith, MD Outstanding Resident Award (Henry Ford Health System, 2006). Dr. Goyal's academic interests include medical education research, teaching evidence-based medicine and using technology to improve healthcare.`,
  },

  {
    name: "Mark Juzych, MD, MHSA",
    title: "Professor and David Barsky Chair",
    organization: "Wayne State University School of Medicine",
    bio: `Mark Juzych, M.D., M.H.S.A., is the David Barsky, MD endowed Chair, and Professor, of Ophthalmology, Visual and Anatomical Sciences department and Director of the Kresge Eye Institute at Wayne State University School of Medicine. He also serves as the Chief Executive Officer of Wayne Health, the WSU physician group.

    A winner of the Palmer Courage to Lead Award from the Accreditation Council for Graduate Medical Education in 2010 and the ACGME’s Palmer Courage to Teach Award in 2005, Dr. Juzych is a 1989 graduate of the Wayne State University School of Medicine. He performed his ophthalmology residency at the Kresge Eye Institute, and served as chief resident from 1992 to 1993. He also served a glaucoma fellowship at the Wilmer Eye Institute at Johns Hopkins University. In addition, he studied at the Johns Hopkins University School of Public Health, and completed the Executive Management Program of the Wharton School of Business at the University of Pennsylvania and the Association of University Professors of Ophthalmology Management Program at the Anderson School of Business at the University of California Los Angeles. He completed a master's degree in Health Services Administration at the University of Michigan Ann Arbor.

    He joined the Wayne State University School of Medicine faculty in 1995 after teaching at Johns Hopkins School of Medicine. He has served as Assistant Dean and Associate Dean of Graduate Medical Education. In 2015, he was named Chief Medical Officer of for the Wayne State University Physician Group. Dr. Juzych formerly served as the Designated Institutional Official and Vice President of GME for the Detroit Medical Center. His has interest in medical informatics and the interface with medical education.`,
  },

  {
    name: "Erin Miller, MD",
    title: "Medical Director, Kado Family Clinical Skills Center",
    organization: "Wayne State University School of Medicine",
    bio: `Dr. Erin Miller completed her undergraduate studies at Michigan State University, earning a Bachelor of Science in Physiology and a Bachelor of Arts in English. She attended medical school at Wayne State University and completed her residency training in the Wayne State University/Detroit Medical Center combined Internal Medicine-Pediatrics program. Dr. Miller has been involved in teaching clinical skills at Wayne State University since 2018. She currently serves as the Medical Director of the Kado Family Clinical Skills Center. She is also a senior staff physician with Henry Ford Medical Group, providing primary care at the Academic Internal Medicine clinic in Detroit alongside internal medicine residents and medical students.`,
  },

  {
    name: "Christopher P. Steffes, MD",
    title: "Associate Dean of Clinical Medical Education",
    organization: "Wayne State University School of Medicine",
    bio: `Dr. Steffes is the Associate Dean of Clinical Medical Education for the Wayne State University School of Medicine. He has been a faculty member of the Department of Surgery for more than 20 years. He joined the WSU faculty in 1993. He served as professor (clinician-educator) in the Department of Surgery since 2009, as the Year III Clerkship director and Year IV Surgery director in the WSU Department of Surgery and for Henry Ford Hospital since 1997.

    Dr. Steffes earned a bachelor's degree in Electrical Engineering in 1982 from Cornell University and his medical degree from the University of Wisconsin, Madison School of Medicine in 1986. His additional training includes the American College of Surgeons, Surgeons as Leaders Course in 2015, the Stanford Clinical Teaching Program Development Course, Wayne State University School of Medicine and the Surgeons as Educators Course, American College of Surgeons in 2002. He has held several hospital appointments, including attending for Detroit Receiving, Harper University, Hutzel Women's and Karmanos hospitals; co-chief of Surgical Oncology for Karmanos Cancer Hospital; and senior staff surgeon for Henry Ford Hospital.`,
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <>
      <main className="min-h-screen flex flex-col items-center font-sans">
        {/* HEADER */}
        <div className="w-full flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <div className="bg-white rounded-md shadow-sm px-3 py-2">
              <div className="relative w-[170px] h-[45px]">
                <img
                  src="/logos/semcme_logo.jpg"
                  alt="SEMCME Logo"
                  className="object-contain rounded-md w-full h-full"
                />
              </div>
            </div>
          </Link>

          <button
            onClick={() =>
              window.history.length > 1 ? router.back() : router.push("/")
            }
            className="bg-white rounded-md shadow-sm px-4 py-2 flex items-center gap-2 text-semcmeBlue font-semibold hover:bg-slate-100 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        {/* TITLE */}
        <div className="max-w-5xl mx-auto text-center mb-6 mt-6 px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            About the Authors
          </h1>
          <p className="text-blue-100 mt-3 text-sm md:text-base">
            Meet the educators, clinicians, and contributors behind the EHR
            Learning Portal.
          </p>
        </div>

        {/* INTRO */}
        <div className="max-w-4xl text-center mb-10 bg-white/90 backdrop-blur rounded-sm p-6 shadow-md mx-4">
          <p className="text-gray-700 text-sm md:text-base leading-relaxed">
            The "Improving EHR Use for Better Outcomes" curriculum is supported
            by a team of experienced educators, clinicians, and healthcare
            leaders. These individuals contribute their expertise to ensure the
            modules reflect real-world clinical practice, high-quality
            documentation standards, and meaningful educational outcomes.
          </p>

          <p className="mt-3 text-gray-600 text-sm">
            Below are the contributors involved in the development and guidance
            of this learning initiative.
          </p>
        </div>

        {/* AUTHORS (FULL WIDTH, SINGLE COLUMN) */}
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-3 px-4">
          {AUTHORS.map((author, index) => (
            <div
              key={index}
              className="bg-white/95 backdrop-blur rounded-sm shadow-lg border border-white/40 p-8"
            >
              {/* NAME + TITLE ROW */}
              <div className="mb-2">
                <h2 className="text-xl font-bold text-semcmeBlue mb-2">
                  {author.name}
                </h2>

                <p className="text-sm text-gray-600">
                  {author.title}
                  {author.organization && ` • ${author.organization}`}
                </p>
              </div>

              <hr className="my-2 border-gray-400" />

              {/* BIO (MULTI-PARAGRAPH SAFE) */}
              <div className="text-gray-900 text-sm md:text-base leading-relaxed space-y-4 whitespace-pre-line">
                {author.bio}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
