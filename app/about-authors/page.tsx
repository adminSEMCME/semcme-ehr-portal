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
    title: "Internal Medicine Physician",
    organization: "Beaumont Hospital, Royal Oak",
    bio: `Dr. Michael Barnes specializes in internal medicine in Royal Oak, MI and has over 27 years of experience in the field of medicine. He graduated from Wayne State University School of Medicine with his medical degree in 1997. He is affiliated with numerous hospitals in Michigan and more, including Beaumont Hospital, Royal Oak.`,
  },

  {
    name: "Cathy Barrett",
    title: "President and Chief Executive Officer",
    organization: "Optysuite",
    bio: `Ms. Barrett received her BSN from the University of Michigan, an MHA from Central Michigan University, and her MSN from Michigan State University. She currently serves as the President and CEO of Optysuite. She has years of experience managing health care organizations, physician group practices, and EMS organizations. Additionally, she has done extensive speaking and consulting throughout the nation. Cathy has extensive experience in nearly all components of the healthcare revenue cycle. She has been involved in turn-around projects and pulling organizations out of bank defaults. As a nurse practitioner and leader, Ms. Barrett was involved in the original 30-minute ER guarantee initiatives that later became a national benchmark. Ms. Barrett has extensive experience in workflow evaluation and design.`,
  },

  {
    name: "Kim Bruley",
    title: "Clinical Coding Manager",
    organization: "Corewell Health East",
    bio: `Ms. Kim Bruley is the Clinical Coding Manager at Corewell Health East.`,
  },

  {
    name: "Barbara Cadovich",
    title: "Associate Vice President of Quality and Patient Safety",
    organization: "Wayne Health",
    bio: `Ms. Cadovich received her BSN from the University of Detroit Mercy and her MSA from Central Michigan University. She is currently the Associate Vice President of Quality and Patient Safety at Wayne Health. There she is promoting a culture focused on patient safety, quality, and patient experience improvement and clinical risk management.

    Prior to joining Wayne Health, Ms. Cadovich served in many roles at Blue Cross Blue Shield of Michigan. These positions include Director of Clinical Strategy and Compliance and Director of Business Segment Consulting. As a senior healthcare executive, she has an eye on the future of patient care and a passion for driving organizational growth, profitability, and quality to new heights. A hands-on leader, strategic decision-maker, and disciplined financial manager. She takes a transformational approach to the delivery of physician services with a strong track record of driving satisfaction for patients, employees, and healthcare providers.

    Leveraging a clinical background as a Registered Nurse and a solid track record of strengthening quality. She is known as an innovator and change agent with a strong focus on continuous improvement to resolve operational challenges, improve care delivery, and transform financial metrics.`,
  },

  {
    name: "Ted Daniel, MD, FAAP",
    title: "Chief Medical Information Officer, Southeast Region",
    organization: "Ascension Michigan",
    bio: `Dr. Daniel, a member of the American Academy of Pediatrics and the Macomb County Medical Society, is the Chief Medical Information Officer for the Southeast Region of Ascension Michigan. He is board certified in Pediatrics and received his medical degree from Wayne State University. Dr. Daniel completed his residency at Ascension St. John Hospital and his clinical interests include caring for children with asthma and attention deficit hyperactivity disorder.`,
  },

  {
    name: "Robert Flora, MD, MBA, MPH",
    title: "Chief Academic Officer and Designated Institutional Official",
    organization: "McLaren Health Care",
    bio: `Dr. Robert F. Flora, MD, MBA, MPH is the Chief Academic Officer and Designated Institutional Official (DIO) of McLaren Health Care, based in Grand Blanc. In addition to his administrative and clinical responsibilities, Dr. Flora is also a Professor and Associate Chair for Education in the Department of Obstetrics, Gynecology, and Reproductive Biology at Michigan State University College of Human Medicine. Dr. Flora has had a long-held interest in the use of technology in medical education dating back to the Atari and Commodore 128 days. He is board certified in Obstetrics and Gynecology, as well as Female Pelvic Medicine and Reconstructive Surgery. He utilizes technology in the education of quality improvement and patient safety and in 2006 completed a Graduate Program in Patient Safety from Virginia Commonwealth University. Dr. Flora is currently enrolled in the Graduate Certificate Program in Educational Technology at Michigan State University. He is a faculty member for the AAMC’s Teaching for Quality (Te4Q) faculty development program. He was certified in Six Sigma and Lean through Villanova University. Other board certifications include Physician Executive (CPE), Public Health (CPH), and Quality Improvement (HCQM 2004-14).`,
  },

  {
    name: "Sherry Sheinfeld Gorin",
    title: "Research Professor and Director, New York Physicians Against Cancer",
    organization: "University of Michigan and NYPAC",
    bio: `Dr. Sheinfeld Gorin has held positions of leadership in cancer prevention and control both nationally and internationally. She has emphasized the rigorous examination of intervention approaches that can be implemented in primary care settings to improve population health. Her more than 250 publications and presentations have led to policy and practice changes that have enhanced value and reduced health care costs. Among her honors, Dr. Sheinfeld Gorin recently received the prestigious Fulbright Distinguished Scholar Award for her studies on HPV vaccine hesitancy in diverse sub-populations. Dr. Sheinfeld Gorin is a frequent invited scientific contributor to NIH study sections and other important grant review groups. Dr. Sheinfeld Gorin's most recent position was Research Professor, Department of Family Medicine, Michigan Medicine, University of Michigan and the School of Public Health. She is also the Director of the New York Physicians Against Cancer (NYPAC), a grant-funded research and training group that works with primary care physicians to implement state-of-the-art interventions in cancer prevention and screening. She was the founding director of an endowed Office of Cancer Health Disparities Research at the Mayo Clinic Cancer Center.`,
  },

  {
    name: "Nikhil Goyal, MD",
    title: "Physician",
    organization: "Henry Ford Health System",
    bio: `Dr. Goyal is board certified in Emergency Medicine, Internal Medicine and Clinical Informatics. He received his medical degree from Maulana Azad Medical College in India and completed his residency in Emergency Medicine and Internal Medicine at Henry Ford Hospital in Detroit, Michigan. Dr. Goyal has served in several GME leadership positions within Henry Ford Health and with national organizations such as the ACGME and the National Resident Matching Program. He has received multiple awards including the Distinguished Section Editor award from the Western Journal of Emergency Medicine (2019), “Top Docs” Emergency Medicine Listing, Hour Magazine (2012-2025), and Roger F. Smith, MD Outstanding Resident Award (Henry Ford Health System, 2006). Dr. Goyal’s academic interests include medical education research, teaching evidence-based medicine and using technology to improve healthcare.`,
  },

  {
    name: "Justin Jevicks, DO",
    title: "Chief Resident, Internal Medicine",
    organization: "Trinity Health Ann Arbor",
    bio: `Dr. Jevicks received his DO from Michigan State University College of Osteopathic Medicine. He is currently the Chief Resident in the Internal Medicine department at Trinity Health Ann Arbor.`,
  },

  {
    name: "John Joseph, MD",
    title: "Emergency Medicine Physician",
    organization: "Henry Ford Health",
    bio: `Dr. John Joseph is an experienced emergency medicine physician at Henry Ford Health based in Detroit, Michigan. Dr. Joseph specializes in treating a variety of acute medical conditions, including trauma, heart attacks, strokes, and severe infections. He is known for his calm demeanor and patient-centered approach, ensuring that he listens to his patients and provides educational health information. He is certified by the American Board of Emergency Medicine. Dr. Joseph completed Medical School at Wayne State University School of Medicine in Detroit, MI in 2016, and an internship and residency at the Department of Emergency Medicine at the University of Michigan in Ann Arbor, MI in 2020.`,
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
    name: "Arati Kelekar, MD",
    title: "Rheumatologist",
    organization: "Henry Ford and Corewell Health Systems",
    bio: `Dr. Kelekar is a Rheumatologist in practice in Warren and mentors residents at Henry Ford and Corewell Health Systems. Previously, she worked for several years as a hospitalist at Corewell Royal Oak and served as a co-course director for the clinical skills course at Oakland University William Beaumont School of Medicine. All the above roles have impacted her understanding of how EHR use familiarity and efficiency impact overall patient care and learning experience as well as the growth curve of both students and residents. She believes that formal education is critical to successfully navigating through any EHR system and using it beneficially to provide patient-centric care. She hopes this project will promote health care worker satisfaction and well-being.`,
  },

  {
    name: "Heidi Kromrei, PhD",
    title: "Designated Institutional Official and Director of Medical Education",
    organization: "Trinity Health Oakland Hospital",
    bio: `Heidi Kromrei, Ph.D. is the Designated Institutional Official and Director of Medical Education at Trinity Health Oakland Hospital in Pontiac, Michigan. Prior to joining Trinity Health Oakland, Dr. Kromrei was the Assistant Dean of Learning and Teaching in the Office of Medical Education at Wayne State University School of Medicine and served as the Associate Designated Institutional Official, Director of Medical Education for Osteopathic Programs, and Assistant Vice President for Academic Affairs at the Detroit Medical Center. Before entering the field of medical education, Dr. Kromrei spent 14 years working in health and behavior research at the University of Illinois in Chicago, the University of Michigan and Henry Ford Health System.

    Dr. Kromrei received her doctoral degree in philosophy from Wayne State University in the Department of Education, Division of Administration and Organizational Development. She holds a bachelor's degree in psychology from the University of Illinois at Chicago and a master of arts in education degree from the University of Michigan-Dearborn. Dr. Kromrei is a volunteer Adjunct Associate Professor of Ophthalmology, Visual and Anatomical Sciences at Wayne State University School of Medicine and a Clinical Instructor at Michigan State University College of Osteopathic Medicine. Her research interests include performance measurement and management in organizational systems and program evaluation.`,
  },

  {
    name: "Jeanette Lyons",
    title: "Director of Clinical Documentation Integrity and Coding Quality",
    organization: "Corewell Health East",
    bio: `Jeanette Lyons is the Director of Clinical Documentation Integrity and Coding Quality at Corewell Health East.`,
  },

  {
    name: "Erin Miller, MD",
    title: "Medical Director, Kado Family Clinical Skills Center",
    organization: "Wayne State University School of Medicine",
    bio: `Dr. Erin Miller completed her undergraduate studies at Michigan State University, earning a Bachelor of Science in Physiology and a Bachelor of Arts in English. She attended medical school at Wayne State University and completed her residency training in the Wayne State University/Detroit Medical Center combined Internal Medicine-Pediatrics program. Dr. Miller has been involved in teaching clinical skills at Wayne State University since 2018. She currently serves as the Medical Director of the Kado Family Clinical Skills Center. She is also a senior staff physician with Henry Ford Medical Group, providing primary care at the Academic Internal Medicine clinic in Detroit alongside internal medicine residents and medical students.`,
  },

  {
    name: "Sonal Patel, MAT",
    title: "Undergraduate Medical Education Curriculum Consultant",
    organization: "Henry Ford Health",
    bio: `Sonal Patel currently serves as the Undergraduate Medical Education Curriculum Consultant for Henry Ford Health. Leveraging over 20 years of experience across primary, secondary, and medical education learning environments, Sonal’s expertise lies in curriculum, instruction, and assessment methodologies.

    Previously, Sonal served as the Director of the Clinical Skills Training and Simulation Center for Oakland University William Beaumont School of Medicine. Sonal also served in leadership roles at Wayne State University School of Medicine, first as the Assistant Director of Clinical Evaluation of Kado Family Clinical Skills Center, then as the Curriculum Specialist for the Office of Learning and Teaching.

    Prior to transitioning to medical education, Sonal had an extensive career in K12 education as a teacher and district instructional coach, while working as a professional tour guide in Detroit for nearly two decades. Sonal’s earliest work experience was conducting research on an NIH-funded cancer genetics project with Henry Ford Health.

    Sonal is a proud alumnus from Wayne State University with a master’s degree in Teaching and bachelor’s degree in Biological Science. Her academic interests include faculty development, clinical curriculum design, and empowering vulnerable learners.`,
  },

  {
    name: "Senthil Kumar Rajasekaran, MD, MMHPE",
    title: "Senior Associate Dean for Curricular Affairs and Undergraduate Medical Education",
    organization: "Wayne State University School of Medicine",
    bio: `Dr. Rajasekaran is Senior Associate Dean for Curricular Affairs and Undergraduate Medical Education for the Wayne State University School of Medicine. He provides leadership and has the primary responsibility for the design, continuing development and implementation of the curriculum leading to the medical degree. A professor of Pharmacology, he served as Associate Dean for Academic Affairs at Eastern Virginia Medical School where he led a major curriculum reform that demonstrated improved learning outcomes and won national recognition for its innovative design and focus on social determinants of health and chronic disease prevention and management. Dr. Rajasekaran was a founding co-director of the Center of Excellence in Medical Education at Oakland University William Beaumont School of Medicine and was instrumental in establishing the fellowship in Medical Education and Residents as Teachers programs. Dr. Rajasekaran has written and co-written multiple publications and serves as a deputy editor of the Teaching and Learning in Medicine Journal.`,
  },

  {
    name: "Arthur L. Riba, MD, FACC",
    title: "Graduate Medical Education Director of Quality Improvement and Patient Safety",
    organization: "Corewell Health East",
    bio: `Dr. Riba completed an Internal Medicine Residency at the University of Pennsylvania and a Cardiology Fellowship at Yale. He came to Dearborn Hospital and Medical Center in 1993, where he served as Medical Director of the Coronary Care Unit and Cardiovascular Quality Management, Medical Director of Quality, Patient Safety and Experience for the Oakwood Legacy System and other leadership positions in the Department of Cardiology and the Cardiology Fellowship Program. He also served as Clinical Professor of Medicine through Wayne State University and is presently Clinical Professor of Medicine at Oakland University William Beaumont School of Medicine, where he serves on a number of curriculum committees.

    Dr. Riba served as site director for many multicenter clinical research trials and has won many awards for teaching and been recognized for his leadership roles in Quality Improvement. He graduated from the Patient Safety Executive Development Program at the Institute for Healthcare Improvement and the Patient Safety Certificate Program at Johns Hopkins. From 2016 to 2017, he was Medical Director for the Beaumont Health Clinical Documentation Improvement Program.

    In 2017, he left Beaumont to pursue a two-year Advanced Fellowship in Patient Safety at the VA National Center for Patient Safety in Ann Arbor. After serving as Chief of Medicine and Associate Chief of Staff at the Bath NY VAMC, he returned to Beaumont to take on the role of Graduate Medical Education Director of Quality Improvement and Patient Safety, a position he presently holds for Corewell Health East. He has served as Chair of the Quality Committee of the Michigan ACC, an active member of a number of National ACC QI initiatives and is presently Chair of the Quality Committee of Southeast Michigan Center for Medical Education. He also co-chairs the BCBSM/SEMCME EHR CME Subcommittee. His major interests are educating, training and engaging residents in QI and Patient Safety and experiential learning and supporting health care providers to optimize their documentation for quality performance.`,
  },

  {
    name: "Abdulghani Sankari, MD, PhD",
    title: "Director of Medical Education and ACGME Designated Institutional Official",
    organization: "Ascension-Providence Hospital",
    bio: `Dr. Sankari received his MD from Aleppo School of Medicine, his MS from Wayne State University, and his PhD from Wayne State University. He is currently the Director of Medical Education, ACGME Designated Institutional Official at Ascension-Providence Hospital. He has served in several leadership roles including the director of the Pulmonary and Critical Care Medicine Fellowship of Wayne State University and has been playing a key role in the development of graduate medical education programs at the Detroit Medical Center. Dr. Sankari completed his residency at the University of Rochester Affiliated Hospitals and is Board Certified in Internal Medicine, Pulmonary Diseases, Critical Care Medicine, and Sleep Medicine. He has held teaching appointments at Wayne State University and Michigan State University College of Human Medicine. He has over 20 years of experience as a scientist, physician, and educator. Dr. Sankari is a member of several scientific boards including the National Institutes of Health and Veterans Affairs review panels and is a member and fellow of several professional societies, including the American College of Chest Physicians, the American Academy of Sleep Medicine, and the American Thoracic Society. He was the recipient of multiple awards including the 2014 College Teaching Award and the American Thoracic Society Innovation Awards in Fellowship Education in 2018 and 2019.

    Dr. Sankari has secured millions of dollars in grants and has been the principal investigator for government- and non-government-funded studies examining pathophysiology and outcomes for sleep-disordered breathing. He has contributed more than 50 published abstracts at national and international scientific meetings and has published more than 40 articles in peer-reviewed journals.`,
  },

  {
    name: "Christopher Steffes, MD",
    title: "Associate Dean of Clinical Medical Education",
    organization: "Wayne State University School of Medicine",
    bio: `Dr. Steffes is the Associate Dean of Clinical Medical Education for the Wayne State University School of Medicine. He has been a faculty member of the Department of Surgery for more than 20 years. He joined the WSU faculty in 1993. He served as professor (clinician-educator) in the Department of Surgery since 2009, as the Year III Clerkship director and Year IV Surgery director in the WSU Department of Surgery and for Henry Ford Hospital since 1997.

    Dr. Steffes earned a bachelor's degree in Electrical Engineering in 1982 from Cornell University and his medical degree from the University of Wisconsin, Madison School of Medicine in 1986. His additional training includes the American College of Surgeons, Surgeons as Leaders Course in 2015, the Stanford Clinical Teaching Program Development Course, Wayne State University School of Medicine and the Surgeons as Educators Course, American College of Surgeons in 2002. He has held several hospital appointments, including attending for Detroit Receiving, Harper University, Hutzel Women's and Karmanos hospitals; co-chief of Surgical Oncology for Karmanos Cancer Hospital; and senior staff surgeon for Henry Ford Hospital.`,
  },

  {
    name: "Anupam Sule, MD",
    title: "Medical Director of Outcomes and Informatics",
    organization: "St. Joseph Mercy Oakland",
    bio: `Dr. Anupam Sule completed his medical school training at the prestigious Byramjee Jeejeebhoy Medical College and Sassoon General Hospitals in Pune, India. He pursued his research interests by successfully completing a Doctorate in Philosophy in Biomedical Sciences (Molecular Cardiovascular Physiology Track) at the University of North Texas Health Science Center. He moved to Michigan for his Residency in Internal Medicine at Oakland University William Beaumont Hospital in Royal Oak, Michigan. His passion for medical education led to the roles of Chief Resident, Clerkship Director, Assistant Program Director, and Program Director while he worked as an internal medicine physician at multiple hospitals in southeast Michigan in the Beaumont, Detroit Medical Center, Henry Ford, and Trinity Health systems. He completed a subspecialty in Clinical Informatics while working at Trinity Health Michigan. Dr. Sule currently serves as the Medical Director of Outcomes and Informatics at St. Joseph Mercy Oakland. He has published papers and book chapters in the field of clinical informatics. Dr. Sule cares deeply about the welfare of his clinical colleagues and feels there is a pressing need for a focused educational experience and optimization of user experience of electronic health records.`,
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
        <div className="mx-4 mb-10 max-w-4xl rounded-sm border border-slate-200 bg-slate-50 p-6 text-center">
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

          <div className="grid gap-4">
            {PROJECT_LEADS.map((author, index) => {
              return (
                <div
                  key={index}
                  className="grid items-start gap-5 rounded-sm border border-slate-200 bg-slate-50 p-6 md:grid-cols-[minmax(210px,0.3fr)_minmax(0,1fr)] md:gap-8"
                >
                  <div className="min-w-0 border-b border-slate-300 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-8">
                    <h3 className="mb-1 text-lg font-bold text-semcmeBlue">
                      {author.name}
                    </h3>
                    <p className="text-sm text-gray-600">{author.title}</p>
                  </div>

                  <div className="space-y-3 text-[0.9rem] leading-relaxed text-gray-800">
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
                className="rounded-sm border border-slate-200 bg-slate-50 p-8"
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
