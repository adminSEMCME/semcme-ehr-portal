"use client";

import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";

interface Author {
  name: string;
  title: string;
  organization?: string;
  bio: string;
}

const PROJECT_LEADS = [
  {
    name: "Nadia Juzych, DSc MS",
    title: "EHR Project Director",
    bio: `Dr. Juzych is the Director of Research Programs and leads the Quality Improvement, Research, Artificial Intelligence in Medicine, and Undergraduate Medical Education programs for the Southeast Michigan Center for Medical Education, developing courses, programs, and presentations.

    She is the lead organizer for the SEMCME – BCBSM EHR Educational Program and the Michigan Summit on Quality Improvement & Patient Safety/Research Forum, an annual gathering of Michigan medical professionals that showcases quality improvement and research projects completed by Michigan medical residents and fellows.

    Dr. Juzych serves as an Associate Editor for the Michigan Medical Education and Health Bulletin. She formerly served as the Executive Director of the Michigan Antimicrobial Resistance Reduction coalition (MARR), responsible for organizing statewide educational efforts and research programs for physicians and the public to reduce antimicrobial resistance.

    Previously, she served on the faculty of the Bloomberg School of Public Health at Johns Hopkins University in the Department of Health Policy and Management and as a member of the faculty of the Risk Sciences and Public Policy Institute, participating as an instructor of environmental health, risk sciences, and toxicology courses.

    Her research includes work for the US EPA, the CDC, HRSA, AFMIC, DOD, and other federal, state and local agencies as well as the PEW Charitable Trusts and other private foundations.

    Dr. Juzych received her doctorate in environmental health from Boston University School of Public Health, MS in environmental and occupational health from California State University Northridge and her BS in microbiology from the University of California Los Angeles.`,
  },

  {
    name: "Michael Geheb, MD, FACP, FCCM",
    title: "EHR Project Co-Director",
    bio: `Dr. Geheb serves as the Executive Director of the Southeast Michigan Center for Medical Education and oversees the programming, budgeting, and strategic direction of the organization. He serves as an Associate Editor for the Michigan Medical Education and Health Bulletin.

    Dr. Geheb has had executive responsibility for three Academic Health Systems, seven hospitals (including a children's hospital), five physician group practices and three medical schools. He has had a long-standing interest in medical education and its training requirements and is experienced in developing clinical and academic programs, including recruitment of physician and administrative leadership, and leading financial and operational integration strategies for health systems including academic health centers.

    Dr. Geheb received his undergraduate degree from Wayne State University School of Medicine and his Medical Doctorate from the University of Pennsylvania. He has served on the board of the American Board of Internal Medicine and its Executive Committee (ABIM), was a member of the Internal Medicine review committee of the Accreditation Council for Graduate Medication (ACGME), a board and executive committee member of the University Health System Consortium (UHC; now Vizient Health), and Region 5 Health Policy Board of the American Hospital Association.`,
  },

  {
    name: "Veronica Haque, BIS",
    title: "EHR Project Staff",
    bio: `Veronica Haque is a program manager for the Southeast Michigan Center for Medical Education (SEMCME). Veronica first joined SEMCME in 2022 as an administrative assistant and has been promoted to program manager over time.

    She oversees and assists on several program committees that organize educational events in the medical field and performs miscellaneous administrative work. Mrs. Haque helps create and send out campaigns for programs, collect registration, run programs, and track attendance for events.

    She also organizes committee meetings and follows up with action items that are to be completed by her and the committee. Veronica graduated from Oakland University with a Bachelor in Integrative Studies. A majority of her coursework focused on organization and administration within the healthcare industry. Her previous experience includes two summer internships at an assisted living/memory care center and a homecare nursing agency working under the administration and human resource directors.`,
  },
];

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
    name: "Kim Bruley",
    title: "Clinical Coding Manager",
    organization: "Corewell Health East",
    bio: `Ms. Kim Bruley is the Clinical Coding Manager at Corewell Health East.`,
  },

  {
    name: "Nikhil Goyal, MD",
    title: "Physician",
    organization: "Henry Ford Health System",
    bio: `Dr. Goyal is board certified in Emergency Medicine, Internal Medicine and Clinical Informatics. He received his medical degree from Maulana Azad Medical College in India and completed his residency in Emergency Medicine and Internal Medicine at Henry Ford Hospital in Detroit, Michigan. Dr. Goyal was until recently the Director of Medical Education for Henry Ford Wyandotte Hospital, and he has served on various committees of the ACGME and the board of directors of the National Resident Matching Program. He has received multiple awards including the Distinguished Section Editor award from the Western Journal of Emergency Medicine (2019), “Top Docs” Emergency Medicine Listing, Hour Magazine (2012-2024), and Roger F. Smith, MD Outstanding Resident Award (Henry Ford Health System, 2006). Dr. Goyal's academic interests include medical education research, teaching evidence-based medicine and using technology to improve healthcare.`,
  },

  {
    name: "John Joseph, MD",
    title: "Emergency Medicine Physician",
    organization: "Henry Ford Health",
    bio: `Dr. John Joseph is an experienced emergency medicine physician at Henry Ford Health based in Detroit, Michigan. Dr. Joseph specializes in treating a variety of acute medical conditions, including trauma, heart attacks, strokes, and severe infections. He is known for his calm demeanor and patient-centered approach, ensuring that he listens to his patients and provides educational health information. He is certified by the American Board of Emergency Medicine. Dr. Joseph completed medical school at Wayne State University School of Medicine in Detroit, MI in 2016, and an internship and residency at the Department of Emergency Medicine at the University of Michigan in Ann Arbor, MI in 2020.`,
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
    name: "Christopher Steffes, MD",
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
        <AppHeader action="back" />

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
        <div className="max-w-4xl text-center mb-10 bg-white/90 rounded-sm p-6 shadow-md mx-4">
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

        {/* PROJECT LEADERSHIP */}
        <div className="w-full max-w-7xl mx-auto px-4 mt-6 mb-10">
          <h2 className="text-xl font-semibold text-white tracking-wide mb-4">
            Project Leadership
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROJECT_LEADS.map((author, index) => {
              return (
                <div
                  key={index}
                  className="bg-white/90 rounded-sm shadow-md border border-gray-200 p-7 flex flex-col h-full"
                >
                  <h3 className="text-lg font-bold text-semcmeBlue mb-1">
                    {author.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-2">{author.title}</p>

                  <hr className="my-3 border-gray-300" />

                  <div className="text-gray-800 text-[0.9rem] leading-relaxed space-y-3 overflow-y-auto max-h-[260px] pr-1 no-scrollbar">
                    {author.bio.split("\n\n").map((p, i) => (
                      <p key={i}>{p.trim()}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTRIBUTING AUTHORS */}
        <h2 className="text-xl font-semibold text-white tracking-wide mb-4 px-4 w-full max-w-7xl">
          Contributing Authors
        </h2>

        <div className="w-full max-w-7xl mx-auto flex flex-col gap-3 px-4">
          {[...AUTHORS]
            .sort((a, b) => {
              const getLastName = (name: string) => {
                const namePart = name.split(",")[0]; // "Mark Juzych"
                const parts = namePart.trim().split(" ");
                return parts[parts.length - 1]; // "Juzych"
              };

              return getLastName(a.name).localeCompare(getLastName(b.name));
            })
            .map((author, index) => (
              <div
                key={index}
                className="bg-white/90 rounded-sm shadow-md border border-gray-200 p-8"
              >
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-semcmeBlue mb-2">
                    {author.name}
                  </h2>

                  <p className="text-sm text-gray-600">
                    {author.title}
                    {author.organization && ` • ${author.organization}`}
                  </p>
                </div>

                <hr className="my-3 border-gray-300" />

                <div className="text-gray-800 text-[0.9rem] md:text-[0.95rem] leading-relaxed space-y-4 whitespace-pre-line max-w-6xl">
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
