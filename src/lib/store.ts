// Centralized data models + default state.
// Single source of truth shared by the presenter (src/app/page.tsx) and the editor (src/app/editor/page.tsx).

export interface DashboardStep {
  title: string;
  labels?: string[];
  values: number[];
  max: number;
  finding: string;
  action: string;
  years?: string[];
  targets?: number[];
  actuals?: number[];
  grades?: string[];
  previousValues?: number[];
  cohorts?: string[];
  flows?: number[];
}

export type PerformanceMetric = {
  label: string;
  group?: string;
  value: number;
  previous?: number;
  target?: number;
  unit?: string;
};

export type PerformancePanel = {
  title: string;
  status: string;
  finding: string;
  action: string;
  bullets: string[];
};

export type BudgetRow = {
  label: string;
  allocation: number;
  downloaded: number;
  liquidated: number;
  tax: number;
  utilized: number;
  utilization: number;
};

export type PhilIriLevels = { independent: number; instructional: number; frustration: number };

export type PhilIriDataset = {
  keyStage: "KS2" | "KS3";
  year: string;
  total: number;
  grades: string;
  filipino: PhilIriLevels;
  english: PhilIriLevels;
  interpretation: string[];
};

export type PerformanceBudgetStep = {
  title: string;
  subtitle: string;
  visual: string;
  metrics: PerformanceMetric[];
  panels: PerformancePanel[];
  budgetRows?: BudgetRow[];
  philIri?: PhilIriDataset[];
  roster?: string[];
};

export type PerformanceBudgetState = {
  currentStep: number;
  activePanelIdx: number;
  steps: PerformanceBudgetStep[];
};

export type SavedPerformanceBudgetStep = Partial<Omit<PerformanceBudgetStep, "metrics" | "panels" | "budgetRows">> & {
  metrics?: Partial<PerformanceMetric>[];
  panels?: (Partial<PerformancePanel> & { bullets?: string[] })[];
  budgetRows?: Partial<BudgetRow>[];
};

export type SavedPerformanceBudgetState = Partial<Omit<PerformanceBudgetState, "steps">> & {
  steps?: SavedPerformanceBudgetStep[];
};

export type PerformanceBudgetAppState = Record<string, unknown> & {
  performanceBudget?: PerformanceBudgetState;
};

// Helper types consumed by the editor controls.
export type BudgetRowNumericField = Exclude<keyof BudgetRow, "label">;
export type PerformanceBudgetFieldValue =
  | string
  | number
  | PerformanceMetric[]
  | PerformancePanel[]
  | BudgetRow[];

export const defaultState = {
  theme: 'sunset',
  transition: 'fade',
  mode: 'editor',
  migrationSectionDividers: false,
  notes: {
    "0": "Welcome the SDO review panel. This is the 2nd Quarter Program Implementation Review for Jacinto Nemeño Integrated School, SY 2026–2027.",
    "1": "Five parts: profile, performance dashboards, characterization, budget, and issues and concerns.",
    "divider_1": "We will now proceed to Section 01: School Profile, highlighting the school's background and key statistics.",
    "2": "Small rural integrated school, established 1935. 176 learners, 16 teachers, healthy 1:15 ratio. Recently became an independent SHS.",
    "divider_2": "Moving on to Section 02: Performance Dashboard & Targets, we will examine our enrolment trends and targets across K-12.",
    "3_0": "Kindergarten enrolment shows a continuous decline due to the absence of incoming learners from the Day Care Center, resulting in no new entrants at this entry level. This indicates a weakening feeder system at the early childhood level, which directly affects the sustainability of Kindergarten population in the school.",
    "3_1": "Elementary enrolment has stayed relatively stable, showing a -7 dip in SY 2025-2026 but stabilizing near the target in SY 2026-2027. We need to track transfer-out reasons and focus on learner retention.",
    "3_2": "Junior High School enrolment shows a steady increase due to improved retention strategies, strengthened Grade 6–7 transition support, and strong LGU advocacy encouraging learners to continue in JNIS. This is reinforced by SGC-COOP incentives for honor learners and continuing students, as well as incoming learners from new residents in Manaka. The increase is also supported by improved school facilities, including new JHS classrooms and a dedicated building, along with sufficient teachers, which strengthened parents’ and learners’ confidence in the program.",
    "3_3": "Senior High School enrolment shows a decline from SY 2025–2026 to 2026–2027 due to learner transfers to schools offering Automotive and Cookery, which are not available in JNIS. This is also influenced by previously limited ICT facilities (now improved with the acquisition of 6 computer units) and the use of a less ideal Marcos-type building for SHS, affecting program attractiveness and retention.",
    "3_4": "Tracking learners from Kindergarten to Grade 6 reveals mixed movement across SY 2025–2026 to 2026–2027. Variations are influenced by learner mobility, family-related circumstances, and transfers to nearby schools. In JHS, grade level enrolment shows a shifting distribution with intermediate level increases suggesting improved retention and cohort progression, while entry/exit fluctuations are driven by migration and cohort size differences.",
    "divider_3": "Next is Section 03: Characterization, detailing our performance drivers, bottlenecks, and school systems.",
    "4": "The enrollment action matrix outlines key programs like early registration, Balik-Eskwela, and updates in LIS. Their limitations include limited reach in remote/coastal areas, lack of counseling support, and transportation barriers. To address this, we are strengthening community engagement (SGC + Barangay linkage), and introducing the JNIS Learner Outreach and Mapping Program (LOMP) and CBEAT.",
    "divider_4": "We will now discuss Section 04: Performance & Budget Utilization, focusing on our school MOOE management and utilization for the fiscal year.",
    "5": "This slide details the Characterization Narrative and the Performance Drivers vs. Bottlenecks Matrix across Teachers & Instruction, Materials & Equipment, ICT Environment, Assessment, School Leadership, Division Technical Assistance, and Community/Industry Partnerships. It aligns our execution variables with school performance.",
    "6_0": "Our learning outcomes reveal key insights: ELLNA Numeracy and Mother Tongue showed significant gains (+56.17% and +38.35% respectively) due to foundational skills focus, while English declined by 6.28% and remains a priority. NAT Grade 6 showed excellent gains across Filipino, AP, Math, Science, and English. However, NAT Grade 10 overall proficiency is low at 34.76%, highlighting Science and Math as key priority areas for numeracy and reasoning support.",
    "6_1": "We are proud to recognize our first batch of 16 Grade 12 CSS students who achieved a 100% passing rate in Computer System Servicing NC II in partnership with the Immaculate Conception School of Technology (ICST).",
    "6_2": "Our work immersion and stakeholder support features parent orientations on safety protocols, and barangay/LGU commitment to donating Computer Units to ensure program sustainability.",
    "6_3": "Budget utilization for Elementary School (SOB ES 2026) reached 87.1% (utilizing PHP 312,725.33 of PHP 359,000 downloaded). JHS (SOB JHS 2026) reached 89.2% (utilizing PHP 291,839.74 of PHP 327,000 downloaded), representing excellent financial management.",
    "6_4": "We maintain close documentation and liquidation monitoring of MOOE funds to align remaining funds directly with school operations, teaching, and learning needs.",
    "7": "MOOE is managed by the School Head with the Administrative Officer, ADAS III, BAC, and the Inspectorate Team, strictly following DepEd, government accounting, and COA rules. Middle performers analysis highlights the use of data-driven decisions and technical assistance requests.",
    "divider_5": "Finally, Section 05: Issues and Concerns, outlining our priorities for division technical assistance and support.",
    "8": "Pull the threads together: the priorities the school needs division support on, including resources for remediation programs, additional literacy/numeracy materials, and ICT equipment.",
    "9": "Thank you very much. We now open the floor for the panel's questions and technical assistance."
  } as Record<string, string>,
  slides: {} as Record<number, { texts: Record<number, string>; charts?: any }>,
  dashboard: {
    currentStep: 0,
    steps: [
      {
        title: "Kindergarten",
        years: ["2024-25", "2025-26", "2026-27"],
        targets: [10, 15, 7],
        actuals: [12, 16, 8],
        max: 20,
        finding: "Kindergarten enrolment is declining — with no incoming completers from the Day Care Center, there are no new entrants, weakening the early-childhood feeder system.",
        action: "Strengthen Day Care Center linkage and early-registration drives to rebuild the Kindergarten feeder pipeline."
      },
      {
        title: "Elementary",
        years: ["2024-25", "2025-26", "2026-27"],
        targets: [96, 98, 91],
        actuals: [98, 91, 90],
        max: 120,
        finding: "A -7 dip in 2025-2026, then stabilizing near the target (-1) in 2026-2027.",
        action: "Track transfer-out reasons and strengthen learner retention in the elementary cohort."
      },
      {
        title: "Junior High",
        years: ["2024-25", "2025-26", "2026-27"],
        targets: [52, 52, 56],
        actuals: [52, 56, 59],
        max: 80,
        finding: "Actual enrolment met target in 2024-2025 and exceeded it in the next two years (+4, then +3), a steady upward trend.",
        action: "Set slightly more ambitious targets and plan section/teacher load for continued growth."
      },
      {
        title: "Senior High",
        grades: ["Grade 11", "Grade 12"],
        previousValues: [11, 16],
        values: [8, 11],
        max: 30,
        finding: "Senior High School enrolment shows a decline from SY 2025-2026 to 2026-2027 due to learner transfers to schools offering Automotive and Cookery, which are not available in JNIS. This is also influenced by previously limited ICT facilities, now improved with the acquisition of 6 computer units, and the use of a less ideal Marcos-type building for SHS, affecting program attractiveness and retention.",
        action: "Strengthen SHS program attractiveness by maximizing the new computer units, improving ICT-CSS visibility, and following up facility support for a more suitable SHS learning space."
      },
      {
        title: "Learner Tracking",
        cohorts: ["KG-G1", "G1-G2", "G2-G3", "G3-G4", "G4-G5", "G5-G6", "G7-G8", "G8-G9", "G9-G10"],
        flows: [8, 3, -10, 7, 2, -7, 2, 1, 0],
        max: 20,
        finding: "Grade 3 and Grade 6 grew, while Kindergarten, Grade 2, Grade 5, and JHS Grade 7 / Grade 10 contracted.",
        action: "Strengthen Grade 6 to 7 transition and Grade 10 to 11 bridging into Senior High School."
      }
    ]
  },
  characterization: {
    currentStep: 0,
    activeDomainIdx: 0,
    steps: [
      {
        title: "Equipment & Assessment",
        subtitle: "Curriculum Support — Equipment, ICT & Assessment",
        domains: [
          {
            name: "Instructional Equipment",
            letter: "E",
            driver: "Smart TVs in every classroom and functional Science & Mathematics equipment keep core instruction and hands-on lessons running.",
            bottleneck: "ICT tools are uneven across teachers and equipment is limited relative to rising SHS ICT/CSS demand, capping hands-on competencies.",
            status: "Equipped · ICT uneven",
            maturity: 3,
            bullets: [
              "Smart TVs in all classrooms; printers for all teachers, laptops for some.",
              "Science & Mathematics equipment available and actively used.",
              "ICT tools remain uneven across teachers, affecting consistency."
            ]
          },
          {
            name: "ICT Environment",
            letter: "I",
            driver: "Emerging digital platforms (Wayground, MS Teams) and tablets for testing speed up and clean up assessment data collection.",
            bottleneck: "Inconsistent internet, no dedicated ICT lab or library, and device scarcity limit interactive learning — correlating with low Grade 10 Math (28.27%) and Science (26.29%).",
            status: "Constrained",
            maturity: 2,
            bullets: [
              "Rising SHS ICT Programming enrolment raises equipment demand.",
              "Existing resources are limited relative to curriculum needs.",
              "Hands-on ICT competencies are the most affected."
            ]
          },
          {
            name: "Assessment",
            letter: "A",
            driver: "Data-driven profiling with NAT, ELLNA, CRLA, and PHIL-IRI lets teachers catch learning gaps early and tailor remediation.",
            bottleneck: "Assessment literacy must deepen across the faculty so classroom tests stay valid, consistent, and aligned with regional standards.",
            status: "Functional · strengthen",
            maturity: 3,
            bullets: [
              "Regional Unified Quarterly Exams standardise assessment.",
              "Pacing does not always align with exam coverage.",
              "HOTS / NAT / PISA capacity-building and ICT for data analysis needed."
            ]
          }
        ]
      },
      {
        title: "Teachers & Facilities",
        subtitle: "Curriculum Support — Teachers, Materials & Facilities",
        domains: [
          {
            name: "Teachers",
            letter: "T",
            driver: "Strong commitment to reading and numeracy interventions (CNR-ESP, RRP) drove major elementary gains — Grade 6 NAT Science +46.48% and Math +37.45%.",
            bottleneck: "Beginning teachers (Teacher I) still building classroom management, plus multi-grade and multi-subject loads, strain capacity and slow Grade 10 NAT mastery.",
            status: "Adaptable · multi-level load",
            maturity: 3,
            bullets: [
              "Small, fluctuating classes mean multi-level loads and flexible deployment.",
              "Teachers handle multiple areas and grade levels, esp. JHS and SHS.",
              "SHS ICT Programming raises specialisation demands."
            ]
          },
          {
            name: "Instructional Materials",
            letter: "M",
            driver: "Maximizing foundational reading materials lifted early literacy — a +56.17% shift in ELLNA Numeracy and +38.35% in Mother Tongue.",
            bottleneck: "A shortage of updated media and a staggered MATATAG rollout cause uneven access; limited advanced-text exposure drove ELLNA English down 6.28%.",
            status: "Transitional",
            maturity: 2,
            bullets: [
              "Limited provision; many resources outdated (pandemic-era).",
              "MATATAG rollout delayed and staggered — started Grades 1 & 7.",
              "Uneven access to updated materials across grade levels."
            ]
          },
          {
            name: "Facilities",
            letter: "F",
            driver: "The school maximizes its 14 classrooms and available spaces to keep every program operating.",
            bottleneck: "No computer lab, clinic, DRRM room, or Teen Center; the Home Economics room is dilapidated and SHS uses a less-ideal Marcos-type building.",
            status: "Functional · not optimised",
            maturity: 2,
            bullets: [
              "14 classrooms, incl. temporary Marcos-type structures for SHS.",
              "Missing: computer lab, clinic, DRRM room, Teen Center.",
              "Home Economics room dilapidated, now used as storage."
            ]
          }
        ]
      },
      {
        title: "Governance & Partnerships",
        subtitle: "Curriculum Support — Leadership, SDO & Partnerships",
        domains: [
          {
            name: "School Leadership",
            letter: "L",
            driver: "Strategic tracking, classroom monitoring, and instructional coaching give teachers structural support and strengthen stakeholder trust.",
            bottleneck: "Sustaining continuous instructional leadership is hard while balancing heavy administrative demands and urgent infrastructure fixes.",
            status: "Stabilising",
            maturity: 3,
            bullets: [
              "Operating amid program expansion and SHS validation.",
              "Managing enrolment swings, compliance and limited resources.",
              "Needs stronger forecasting, optimisation and supervision."
            ]
          },
          {
            name: "SDO Technical Assistance",
            letter: "S",
            driver: "Official SDO program validation and direct trainings (MS Teams, ARAL Tutors, Reading Coach) act as a booster shot for instructional quality.",
            bottleneck: "Division manpower is stretched across competing priorities, limiting the frequency of intensive, localized field monitoring and coaching.",
            status: "Comprehensive support",
            maturity: 4,
            bullets: [
              "Training, staffing, ICT, assessment, supervision & governance support.",
              "Strong for compliance and initial implementation needs.",
              "Needs sustained coaching and on-site technical assistance."
            ]
          },
          {
            name: "Community & Partnerships",
            letter: "P",
            driver: "Active PTA and LGU collaboration adds facilities funding; child mapping and 'purok enrollment boxes' stabilize enrolment and keep at-risk readers in school.",
            bottleneck: "Socio-economic challenges — family finances and learner mobility — occasionally overpower outreach efforts and disrupt remedial continuity.",
            status: "Developing",
            maturity: 2,
            bullets: [
              "Strong PTA, Barangay LGU and School Governing Council support.",
              "Backed early SHS / TVL support and work immersion.",
              "Engagement still developing in depth and sustainability."
            ]
          }
        ]
      }
    ]
  },
  performanceBudget: {
    currentStep: 0,
    activePanelIdx: 0,
    steps: [
      {
        title: "Learning Outcomes",
        subtitle: "ELLNA, NAT, and PHIL-IRI performance signals",
        visual: "learning",
        metrics: [
          { label: "ELLNA English", group: "ELLNA", value: 61.23, previous: 67.51, target: 75, unit: "%" },
          { label: "ELLNA Filipino", group: "ELLNA", value: 69.01, previous: 67.95, target: 75, unit: "%" },
          { label: "ELLNA Numeracy", group: "ELLNA", value: 60, previous: 3.83, target: 75, unit: "%" },
          { label: "ELLNA Mother Tongue", group: "ELLNA", value: 63.46, previous: 25.11, target: 75, unit: "%" },
          { label: "NAT G6 Filipino", group: "NAT G6", value: 73.15, previous: 59.26, target: 75, unit: "%" },
          { label: "NAT G6 AP", group: "NAT G6", value: 78.7, previous: 57.41, target: 75, unit: "%" },
          { label: "NAT G6 Math", group: "NAT G6", value: 77.96, previous: 40.51, target: 75, unit: "%" },
          { label: "NAT G6 Science", group: "NAT G6", value: 88.15, previous: 41.67, target: 75, unit: "%" },
          { label: "NAT G6 English", group: "NAT G6", value: 85.74, previous: 44.44, target: 75, unit: "%" },
          { label: "NAT G10 Overall", group: "NAT G10", value: 34.76, target: 75, unit: "%" },
          { label: "NAT G10 Filipino", group: "NAT G10", value: 42.83, target: 75, unit: "%" },
          { label: "NAT G10 AP", group: "NAT G10", value: 42.96, target: 75, unit: "%" },
          { label: "NAT G10 English", group: "NAT G10", value: 33.45, target: 75, unit: "%" },
          { label: "NAT G10 Math", group: "NAT G10", value: 28.27, target: 75, unit: "%" },
          { label: "NAT G10 Science", group: "NAT G10", value: 26.29, target: 75, unit: "%" },
          { label: "K2 English Frustration", group: "PHIL-IRI", value: 2.27, previous: 18, target: 0, unit: "%" },
          { label: "K2 Filipino Frustration", group: "PHIL-IRI", value: 0, target: 0, unit: "%" },
          { label: "K3 Filipino Frustration", group: "PHIL-IRI", value: 10.71, previous: 23.08, target: 0, unit: "%" },
          { label: "K3 English Independent", group: "PHIL-IRI", value: 50, previous: 59.62, target: 75, unit: "%" }
        ],
        philIri: [
          {
            keyStage: "KS2",
            year: "2024-2025",
            total: 50,
            grades: "G4: 16 · G5: 14 · G6: 20",
            filipino: { independent: 60, instructional: 36, frustration: 4 },
            english: { independent: 38, instructional: 44, frustration: 18 },
            interpretation: [
              "Filipino proficiency is strong: 96% of learners sit in the Independent/Instructional zone, and only 4% require intervention.",
              "English needs urgent attention: nearly 1 in 5 learners (18%) is at the Frustration level — prioritise English reading comprehension and decoding."
            ]
          },
          {
            keyStage: "KS2",
            year: "2025-2026",
            total: 44,
            grades: "G4: 12 · G5: 18 · G6: 14",
            filipino: { independent: 79.55, instructional: 20.45, frustration: 0 },
            english: { independent: 65.91, instructional: 31.82, frustration: 2.27 },
            interpretation: [
              "Strong overall progress versus the previous year — a clear upward shift in both languages.",
              "Filipino mastery: 0% at Frustration and nearly 80% reading independently.",
              "English improved dramatically: Frustration dropped to 2.27% (~1 learner), showing earlier reading interventions were highly effective."
            ]
          },
          {
            keyStage: "KS3",
            year: "2024-2025",
            total: 52,
            grades: "G7: 14 · G8: 10 · G9: 14 · G10: 14",
            filipino: { independent: 30.77, instructional: 46.15, frustration: 23.08 },
            english: { independent: 59.62, instructional: 23.08, frustration: 17.31 },
            interpretation: [
              "English is a strength: the majority (59.62%) are Independent readers — unlike the elementary levels.",
              "Filipino needs help: 23.08% at Frustration and 46.15% requiring guided support.",
              "Pivot secondary reading interventions to prioritise Filipino comprehension."
            ]
          },
          {
            keyStage: "KS3",
            year: "2025-2026",
            total: 56,
            grades: "G7: 18 · G8: 15 · G9: 10 · G10: 13",
            filipino: { independent: 57.14, instructional: 32.14, frustration: 10.71 },
            english: { independent: 50, instructional: 33.93, frustration: 16.07 },
            interpretation: [
              "Filipino progresses: Frustration dropped to 10.71% while Independent readers grew to 57.14%.",
              "English steady: half the cohort (50%) remains Independent, though a 16.07% Frustration rate still requires attention.",
              "Solid academic improvement and healthy cohort progression across both languages."
            ]
          }
        ],
        panels: [
          {
            title: "ELLNA",
            status: "Mixed gains",
            finding: "Numeracy and Mother Tongue posted the largest improvements, while English declined and remains a priority.",
            action: "Sustain foundational numeracy gains while intensifying English reading comprehension and vocabulary support.",
            bullets: [
              "Numeracy improved from 3.83% to 60.00%.",
              "Mother Tongue rose from 25.11% to 63.46%.",
              "English decreased from 67.51% to 61.23%."
            ]
          },
          {
            title: "NAT Grade 6",
            status: "Strong growth",
            finding: "Grade 6 performance improved across all areas, with Science, English, and Mathematics exceeding large year-over-year gains.",
            action: "Preserve the intervention cycle that lifted Grade 6 outcomes and use it as the elementary benchmark.",
            bullets: [
              "Science reached 88.15%, the strongest current result.",
              "English reached 85.74% after a 41.30-point increase.",
              "Mathematics reached 77.96%, above the 75% target."
            ]
          },
          {
            title: "NAT Grade 10",
            status: "Priority support",
            finding: "Grade 10 remains below expected mastery, with overall proficiency at 34.76%.",
            action: "Focus JHS remediation on Science, Mathematics, and English while protecting AP and Filipino gains.",
            bullets: [
              "Science is the lowest area at 26.29%.",
              "Mathematics is also a priority at 28.27%.",
              "Araling Panlipunan (42.96%) and Filipino (42.83%) are the strongest areas, with English (33.45%) also lagging — all still below the 75% target."
            ]
          },
          {
            title: "PHIL-IRI",
            status: "Reading recovery",
            finding: "K2 English frustration dropped sharply from 18% to 2.27%, while K3 Filipino frustration also improved.",
            action: "Continue targeted reading remediation and keep secondary Filipino comprehension as a focus area.",
            bullets: [
              "K2 Filipino frustration is down to 0%.",
              "K3 Filipino frustration improved from 23.08% to 10.71%.",
              "K3 English independent readers moved from 59.62% to 50%, requiring monitoring."
            ]
          }
        ]
      },
      {
        title: "NC II",
        subtitle: "Computer Systems Servicing certification result",
        visual: "certification",
        metrics: [
          { label: "Pass Rate", value: 100, target: 100, unit: "%" },
          { label: "Certified Learners", value: 16, target: 16, unit: "" },
          { label: "Partner Support", value: 100, target: 100, unit: "%" }
        ],
        roster: [
          "Alguetas, Darene",
          "Banglos, Jelian",
          "Burgona, Roseller",
          "Canencia, Edmar",
          "Molina, Levin",
          "Taytay, Tonton",
          "Villarin, Johnnil",
          "Cabillon, Maroo",
          "Alonto, Asnairah",
          "Martinez, Ashley Nicole",
          "Hernando, Jennelyn",
          "Naoja, Marie",
          "Permano, Cinderela Jane",
          "Selim, Abegail",
          "Villar, Shianne Grace",
          "Naoja, Leslie"
        ],
        panels: [
          {
            title: "Certification Result",
            status: "100% passed",
            finding: "The first Grade 12 CSS batch reached a 100% NC II passing rate.",
            action: "Use the result as proof of readiness while preparing equipment and coaching for the next batch.",
            bullets: [
              "16 Grade 12 CSS learners passed.",
              "The result validates close monitoring and partner-supported preparation.",
              "The achievement strengthens the SHS ICT-CSS pathway."
            ]
          },
          {
            title: "Industry Partner",
            status: "ICST",
            finding: "Immaculate Conception School of Technology helped convert the first-batch cohort into certified learners.",
            action: "Protect the ICST partnership and define recurring support for assessment preparation.",
            bullets: [
              "Partner coordination supported certification readiness.",
              "Work immersion and certification preparation are connected.",
              "Future cohorts need the same partner-backed preparation cycle."
            ]
          },
          {
            title: "Scale Up Need",
            status: "ICT lab",
            finding: "Certification success is strong, but equipment constraints can limit scale and consistency.",
            action: "Prioritize computer laboratory investment and preventive maintenance for CSS delivery.",
            bullets: [
              "Hands-on ICT competencies require reliable device access.",
              "Certification readiness depends on repeated practice.",
              "Additional equipment will help sustain future pass rates."
            ]
          }
        ]
      },
      {
        title: "Work Immersion",
        subtitle: "Community-supported monitoring and implementation",
        visual: "immersion",
        metrics: [
          { label: "PTA Support", value: 100, target: 100, unit: "%" },
          { label: "LGU Support", value: 100, target: 100, unit: "%" },
          { label: "SGC Support", value: 100, target: 100, unit: "%" }
        ],
        panels: [
          {
            title: "Visible Monitoring",
            status: "Active",
            finding: "Close monitoring of CSS work immersion helped turn partnership activity into certification results.",
            action: "Keep on-site monitoring visible and document learner progress during immersion.",
            bullets: [
              "Monitoring created a clear through-line from immersion to NC II success.",
              "Teacher and partner coordination supported learner readiness.",
              "Documentation should feed future program improvement."
            ]
          },
          {
            title: "Stakeholder Support",
            status: "PTA + LGU + SGC",
            finding: "PTA, Barangay LGU, and SGC support are practical assets for sustaining learner participation.",
            action: "Formalize support roles so assistance is predictable during immersion cycles.",
            bullets: [
              "PTA support helps learner attendance and preparation.",
              "LGU support strengthens community linkage.",
              "SGC support reinforces governance and accountability."
            ]
          },
          {
            title: "Program Continuity",
            status: "Sustain",
            finding: "The immersion model works best when partner engagement, monitoring, and assessment preparation are aligned.",
            action: "Build an annual immersion calendar connected to certification milestones.",
            bullets: [
              "Set recurring partner check-ins.",
              "Track learner readiness before assessment.",
              "Report partner contributions in the next PIR cycle."
            ]
          }
        ]
      },
      {
        title: "Budget Overview",
        subtitle: "School-Based Operating Budget utilization",
        visual: "budgetOverview",
        metrics: [
          { label: "Total SOB Allocation", value: 960000, unit: "PHP" },
          { label: "Downloaded Cash Advance", value: 686000, unit: "PHP" },
          { label: "Total Utilized", value: 604565.07, unit: "PHP" },
          { label: "Downloaded Utilization", value: 88.13, target: 100, unit: "%" }
        ],
        budgetRows: [
          { label: "JNIS ES", allocation: 540000, downloaded: 359000, liquidated: 300118.91, tax: 12606.42, utilized: 312725.33, utilization: 87.1 },
          { label: "JNIS JHS", allocation: 420000, downloaded: 327000, liquidated: 279280.44, tax: 13559.3, utilized: 291839.74, utilization: 89.2 }
        ],
        panels: [
          {
            title: "Resource Picture",
            status: "PHP 960K allocation",
            finding: "The combined SOB allocation is PHP 960,000, with PHP 604,565.07 already utilized from downloaded funds.",
            action: "Maintain liquidation pacing and keep budget reporting linked to learner-facing priorities.",
            bullets: [
              "ES allocation is PHP 540,000.",
              "JHS allocation is PHP 420,000.",
              "Combined downloaded cash advance is PHP 686,000."
            ]
          },
          {
            title: "Utilization Signal",
            status: "88.13% of downloaded",
            finding: "Utilization of downloaded funds is above 88% overall.",
            action: "Keep obligation, liquidation, and tax remittance updates visible in regular monitoring.",
            bullets: [
              "ES utilization of downloaded funds is 87.1%.",
              "JHS utilization of downloaded funds is 89.2%.",
              "Both funds are being liquidated on schedule."
            ]
          }
        ]
      },
      {
        title: "SOB 2026",
        subtitle: "ES and JHS obligation and disbursement detail",
        visual: "sobDetail",
        metrics: [
          { label: "ES Utilization", value: 87.1, target: 100, unit: "%" },
          { label: "JHS Utilization", value: 89.2, target: 100, unit: "%" },
          { label: "Total Utilized", value: 604565.07, unit: "PHP" }
        ],
        budgetRows: [
          { label: "JNIS ES", allocation: 540000, downloaded: 359000, liquidated: 300118.91, tax: 12606.42, utilized: 312725.33, utilization: 87.1 },
          { label: "JNIS JHS", allocation: 420000, downloaded: 327000, liquidated: 279280.44, tax: 13559.3, utilized: 291839.74, utilization: 89.2 }
        ],
        panels: [
          {
            title: "ES SOB 2026",
            status: "87.1% utilized",
            finding: "The ES fund utilized PHP 312,725.33 of the PHP 359,000 downloaded cash advance.",
            action: "Continue liquidation monitoring and align remaining funds to school operations and learning needs.",
            bullets: [
              "Allocation ceiling: PHP 540,000.",
              "Liquidated amount: PHP 300,118.91.",
              "Tax remittance: PHP 12,606.42."
            ]
          },
          {
            title: "JHS SOB 2026",
            status: "89.2% utilized",
            finding: "The JHS fund utilized PHP 291,839.74 of the PHP 327,000 downloaded cash advance.",
            action: "Maintain documentation and liquidation pacing through the next reporting period.",
            bullets: [
              "Allocation ceiling: PHP 420,000.",
              "Liquidated amount: PHP 279,280.44.",
              "Tax remittance: PHP 13,559.30."
            ]
          }
        ]
      }
    ]
  } as PerformanceBudgetState
};

export function getAssetPath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  if (!basePath) return path;
  if (path.startsWith(basePath)) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
}

export function mergeState(stateData: any): any {
  if (!stateData) return defaultState;
  const savedPerformanceBudget = stateData.performanceBudget as SavedPerformanceBudgetState | undefined;
  
  return {
    ...defaultState,
    ...stateData,
    theme: stateData.theme || defaultState.theme,
    transition: stateData.transition || defaultState.transition,
    mode: stateData.mode || defaultState.mode,
    notes: stateData.notes || {},
    slides: stateData.slides || {},
    dashboard: {
      currentStep: stateData.dashboard?.currentStep ?? defaultState.dashboard.currentStep,
      steps: defaultState.dashboard.steps.map((step: any, idx: number) => {
        const savedStep = stateData.dashboard?.steps?.[idx] || {};
        const mergedStep = {
          ...step,
          ...savedStep
        };

        if (idx === 3) {
          const oldFinding = "SHS enrolment declined from 27 to 19 due to transfers to schools offering Cookery / Automotive.";
          const oldAction = "Build on the 6 new computer units to make GAS / ICT-CSS strands more competitive.";
          return {
            ...mergedStep,
            previousValues: step.previousValues,
            finding: !savedStep.finding || savedStep.finding === oldFinding ? step.finding : mergedStep.finding,
            action: !savedStep.action || savedStep.action === oldAction ? step.action : mergedStep.action
          };
        }

        if (idx === 4) {
          return {
            ...mergedStep,
            title: step.title
          };
        }

        return mergedStep;
      })
    },
    characterization: {
      currentStep: stateData.characterization?.currentStep ?? defaultState.characterization.currentStep,
      activeDomainIdx: stateData.characterization?.activeDomainIdx ?? defaultState.characterization.activeDomainIdx ?? 0,
      steps: defaultState.characterization.steps.map((step: any, idx: number) => ({
        ...step,
        ...(stateData.characterization?.steps?.[idx] || {}),
        domains: step.domains.map((dom: any, dIdx: number) => ({
          ...dom,
          ...(stateData.characterization?.steps?.[idx]?.domains?.[dIdx] || {})
        }))
      }))
    },
    performanceBudget: {
      currentStep: savedPerformanceBudget?.currentStep ?? defaultState.performanceBudget.currentStep,
      activePanelIdx: savedPerformanceBudget?.activePanelIdx ?? defaultState.performanceBudget.activePanelIdx ?? 0,
      steps: defaultState.performanceBudget.steps.map((step, idx) => {
        const savedStep = savedPerformanceBudget?.steps?.[idx] || {};
        return {
          ...step,
          ...savedStep,
          metrics: (step.metrics || []).map((metric, metricIdx) => ({
            ...metric,
            ...(savedStep.metrics?.[metricIdx] || {})
          })),
          budgetRows: step.budgetRows
            ? step.budgetRows.map((row, rowIdx) => ({
                ...row,
                ...(savedStep.budgetRows?.[rowIdx] || {})
              }))
            : undefined,
          panels: (step.panels || []).map((panel, panelIdx) => ({
            ...panel,
            ...(savedStep.panels?.[panelIdx] || {}),
            bullets: savedStep.panels?.[panelIdx]?.bullets || panel.bullets
          }))
        };
      })
    }
  };
}

export function getNotesKey(slideIdx: number, state: any): string {
  if (!state) return String(slideIdx);
  if (slideIdx === 2) return "divider_1";
  if (slideIdx === 3) return "2";
  if (slideIdx === 4) return "divider_2";
  if (slideIdx === 5) return `3_${state.dashboard?.currentStep ?? 0}`;
  if (slideIdx === 6) return "4";
  if (slideIdx === 7) return "divider_3";
  if (slideIdx === 8) return "5";
  if (slideIdx === 9) return "divider_4";
  if (slideIdx === 10) return `6_${state.performanceBudget?.currentStep ?? 0}`;
  if (slideIdx === 11) return "7";
  if (slideIdx === 12) return "divider_5";
  if (slideIdx === 13) return "8";
  if (slideIdx === 14) return "9";
  return String(slideIdx);
}
