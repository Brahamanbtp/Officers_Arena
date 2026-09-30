import { Question } from "../store/useArenaStore";

export const BASE_UPSC_QUESTIONS: Question[] = [
  // --- INDIAN POLITY & GOVERNANCE ---
  {
    id: "upsc-pol-1",
    text: "Under the provisions of Article 163 and Article 356 of the Constitution of India, consider the following statements regarding the discretionary powers of the Governor:\n1. The Governor's constitutional discretion under Article 163 is subject to judicial review as established in the S.R. Bommai case.\n2. A Proclamation of President's Rule under Article 356 requires approval by both Houses of Parliament within two months by a simple majority.\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "C",
    explanation: "In S.R. Bommai (1994), the Supreme Court ruled that the Governor's report and Presidential satisfaction under Art. 356 are subject to judicial review. Article 356 proclamation requires parliamentary approval within 2 months by a simple majority.",
    metadata: { difficulty: 0.65, subject: "Indian Polity", topic: "Governor Discretionary Powers (Art. 163 vs 356)" }
  },
  {
    id: "upsc-pol-2",
    text: "With reference to the Preamble of the Indian Constitution, consider the following statements:\n1. The Preamble is an integral part of the Constitution as per the Kesavananda Bharati judgment.\n2. The Preamble is non-justiciable and non-enforceable in courts of law.\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "C",
    explanation: "In Kesavananda Bharati (1973), the Supreme Court held that the Preamble is an integral part of the Constitution, but like DPSP, it is non-justiciable and non-enforceable in a court of law.",
    metadata: { difficulty: 0.55, subject: "Indian Polity", topic: "Preamble & Basic Structure" }
  },
  {
    id: "upsc-pol-3",
    text: "Consider the following statements regarding the Attorney General for India:\n1. He is appointed by the President of India under Article 76.\n2. He must be qualified to be appointed a Judge of the Supreme Court.\n3. He has the right to take part in proceedings of either House of Parliament without the right to vote.\n\nWhich of the statements given above are correct?",
    options: { "A": "1 and 2 only", "B": "2 and 3 only", "C": "1 and 3 only", "D": "1, 2 and 3" },
    correct_answer: "D",
    explanation: "Under Article 76 and Article 88, the Attorney General is appointed by the President, holds qualifications of an SC judge, and possesses rights of audience in all courts and Parliament without voting rights.",
    metadata: { difficulty: 0.60, subject: "Indian Polity", topic: "Constitutional Functionaries" }
  },
  {
    id: "upsc-pol-4",
    text: "Which of the following bodies are Constitutional Bodies established directly by the Constitution of India?\n1. Election Commission of India (Article 324)\n2. National Development Council\n3. Finance Commission of India (Article 280)\n4. NITI Aayog\n\nSelect the correct answer using the code given below:",
    options: { "A": "1 and 3 only", "B": "1, 2 and 3 only", "C": "2 and 4 only", "D": "1, 3 and 4 only" },
    correct_answer: "A",
    explanation: "The Election Commission (Art. 324) and Finance Commission (Art. 280) derive mandate directly from constitutional text. NITI Aayog and NDC are extra-constitutional executive bodies.",
    metadata: { difficulty: 0.45, subject: "Indian Polity", topic: "Constitutional & Non-Constitutional Bodies" }
  },
  {
    id: "upsc-pol-5",
    text: "With reference to Fundamental Rights in the Indian Constitution, which of the following is/are available to both Indian citizens and foreigners (except enemy aliens)?\n1. Protection of life and personal liberty (Article 21)\n2. Equality before law and equal protection of laws (Article 14)\n3. Freedom of speech and expression (Article 19)\n\nSelect the correct answer using the code given below:",
    options: { "A": "1 and 2 only", "B": "1 only", "C": "2 and 3 only", "D": "1, 2 and 3" },
    correct_answer: "A",
    explanation: "Articles 15, 16, 19, 29, and 30 are available ONLY to Indian citizens. Articles 14, 20, 21, 21A, 22, 23, 24, 25, 26, 27, and 28 are available to all persons (citizens and foreigners).",
    metadata: { difficulty: 0.50, subject: "Indian Polity", topic: "Fundamental Rights" }
  },

  // --- MODERN & ANCIENT HISTORY ---
  {
    id: "upsc-hist-1",
    text: "With reference to the Indian freedom struggle, arrange the following historical events in correct chronological order:\n1. First Round Table Conference\n2. Gandhi-Irwin Pact\n3. Poona Pact\n4. Cripps Mission\n\nSelect the correct answer using the code given below:",
    options: { "A": "1 - 2 - 3 - 4", "B": "2 - 1 - 3 - 4", "C": "1 - 3 - 2 - 4", "D": "2 - 3 - 1 - 4" },
    correct_answer: "A",
    explanation: "1. First Round Table Conference (Nov 1930 - Jan 1931); 2. Gandhi-Irwin Pact (March 1931); 3. Poona Pact (Sept 1932); 4. Cripps Mission (March 1942). Correct chronological sequence is 1-2-3-4.",
    metadata: { difficulty: 0.65, subject: "Modern History", topic: "1930–1942 Round Table & Mission Chronology" }
  },
  {
    id: "upsc-hist-2",
    text: "Consider the following statements regarding the Morley-Minto Reforms (Indian Councils Act 1909):\n1. It introduced separate communal electorates for Muslims.\n2. It allowed non-official majorities in provincial legislative councils.\n3. Satyendra Prasad Sinha became the first Indian appointed to the Viceroy's Executive Council.\n\nWhich of the statements given above are correct?",
    options: { "A": "1 and 2 only", "B": "2 and 3 only", "C": "1 and 3 only", "D": "1, 2 and 3" },
    correct_answer: "D",
    explanation: "The 1909 Act introduced separate electorates (Lord Minto known as Father of Communal Electorate), allowed non-official majority in provinces, and S.P. Sinha was appointed as Law Member.",
    metadata: { difficulty: 0.55, subject: "Modern History", topic: "Constitutional Development Under British Rule" }
  },
  {
    id: "upsc-hist-3",
    text: "With reference to the Indus Valley Civilization site of Rakhigarhi, consider the following statements:\n1. It is currently recognized as the largest Mature Harappan settlement in the Indian subcontinent.\n2. Excavations revealed evidence of fortified citadel walls, multi-tiered drains, and lapidary workshops.\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "C",
    explanation: "Rakhigarhi in Hisar, Haryana spans over 350 hectares, surpassing Mohenjo-daro as the largest IVC metropolis, with advanced terracotta soak jar drains and lapidary workshops.",
    metadata: { difficulty: 0.50, subject: "Ancient History", topic: "Indus Valley Civilization & Town Planning" }
  },
  {
    id: "upsc-hist-4",
    text: "Regarding the Cabinet Mission Plan (1946), which of the following statements are correct?\n1. It rejected the demand for a separate sovereign Pakistan.\n2. It proposed a three-tier grouping of provinces into Sections A, B, and C.\n3. It recommended a weak Union government controlling Defense, Foreign Affairs, and Communications.\n\nSelect the correct answer using the code given below:",
    options: { "A": "1 and 2 only", "B": "2 and 3 only", "C": "1, 2 and 3", "D": "1 and 3 only" },
    correct_answer: "C",
    explanation: "The Cabinet Mission (Pethick-Lawrence, Stafford Cripps, A.V. Alexander) rejected sovereign Pakistan, recommended provincial grouping (A, B, C) and a central union with limited subjects.",
    metadata: { difficulty: 0.60, subject: "Modern History", topic: "Cabinet Mission & Independence" }
  },

  // --- INDIAN ECONOMY & MACROECONOMICS ---
  {
    id: "upsc-econ-1",
    text: "With reference to Monetary Policy Transmission in India, consider the following statements regarding the External Benchmark Lending Rate (EBLR):\n1. The RBI mandated all scheduled commercial banks to link floating retail loans to external benchmarks like the Repo Rate or T-Bill yields.\n2. EBLR was introduced to overcome the delayed monetary transmission observed under the Marginal Cost of Funds based Lending Rate (MCLR).\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "C",
    explanation: "In October 2019, RBI mandated all floating retail and MSME loans to link to an external benchmark (Repo Rate or 3-Month T-Bill) to ensure rapid, transparent monetary transmission.",
    metadata: { difficulty: 0.65, subject: "Indian Economy", topic: "Monetary Transmission & Repo Spread (EBLR)" }
  },
  {
    id: "upsc-econ-2",
    text: "Which of the following constitutes the 'Effective Revenue Deficit' as defined under the Fiscal Responsibility and Budget Management (FRBM) Act?\n1. Revenue Deficit minus Grants for Creation of Capital Assets\n2. Fiscal Deficit minus Interest Payments\n3. Primary Deficit plus Capital Receipts\n4. Gross Budgetary Support minus Net Borrowing",
    options: { "A": "1", "B": "2", "C": "3", "D": "4" },
    correct_answer: "A",
    explanation: "Effective Revenue Deficit = Revenue Deficit - Grants given to States/UTs for the creation of capital assets. It was introduced in the Union Budget 2011-12 to distinguish productive revenue expenditure.",
    metadata: { difficulty: 0.55, subject: "Indian Economy", topic: "Fiscal Policy & Deficits" }
  },
  {
    id: "upsc-econ-3",
    text: "Consider the following statements regarding Open Market Operations (OMOs) conducted by the Reserve Bank of India:\n1. Outright OMO purchases of government securities inject durable liquidity into the banking system.\n2. OMO sales of government securities absorb excess liquidity to curb inflationary pressure.\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "C",
    explanation: "Under OMOs, RBI buys G-Secs to inject liquidity and sells G-Secs to absorb excess liquidity as part of quantitative monetary management.",
    metadata: { difficulty: 0.50, subject: "Indian Economy", topic: "RBI Monetary Policy Tools" }
  },

  // --- GEOGRAPHY & ENVIRONMENT ---
  {
    id: "upsc-geo-1",
    text: "With reference to the Western Ghats ecology in India, consider the following statements:\n1. The Madhav Gadgil Committee recommended designating the entire Western Ghats as an Ecologically Sensitive Area (ESA).\n2. The Western Ghats is one of the eight global 'hottest hotspots' of biological diversity.\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "C",
    explanation: "The WGEEP (Gadgil Committee, 2011) recommended 100% ESA with three vulnerability zones. Western Ghats is an internationally recognized biodiversity hotspot holding immense endemic flora and fauna.",
    metadata: { difficulty: 0.60, subject: "Geography & Environment", topic: "Western Ghats & Conservation Committees" }
  },
  {
    id: "upsc-geo-2",
    text: "Regarding the Indian Ocean Dipole (IOD), consider the following statements:\n1. A Positive IOD phenomenon leads to warmer sea surface temperatures in the western Indian Ocean and brings bountiful monsoon rainfall to India.\n2. A Negative IOD is associated with higher temperatures in the eastern Indian Ocean and suppressed Indian monsoon rainfall.\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "C",
    explanation: "Positive IOD (warmer western Indian Ocean near Horn of Africa) aids the southwest monsoon, while Negative IOD weakens monsoon flows across the subcontinent.",
    metadata: { difficulty: 0.55, subject: "Geography & Environment", topic: "Monsoon Dynamics & IOD" }
  }
];

export const BASE_CDS_QUESTIONS: Question[] = [
  // --- ELEMENTARY MATHEMATICS ---
  {
    id: "cds-math-1",
    text: "In a right-angled triangle ABC right-angled at B, if AB = 6 cm and BC = 8 cm, what is the radius of the in-circle (inradius r) of the triangle?",
    options: { "A": "2 cm", "B": "3 cm", "C": "4 cm", "D": "2.5 cm" },
    correct_answer: "A",
    explanation: "Hypotenuse c = sqrt(6^2 + 8^2) = 10 cm. For a right triangle, inradius r = (a + b - c) / 2 = (6 + 8 - 10) / 2 = 2 cm.",
    metadata: { difficulty: 0.50, subject: "Elementary Mathematics", topic: "Geometry & Incircle" }
  },
  {
    id: "cds-math-2",
    text: "A train running at a speed of 72 km/h crosses a 200m long platform in 25 seconds. What is the length of the train (in meters)?",
    options: { "A": "250 m", "B": "300 m", "C": "350 m", "D": "400 m" },
    correct_answer: "B",
    explanation: "Speed in m/s = 72 * (5/18) = 20 m/s. Total distance covered = Speed * Time = 20 * 25 = 500m. Train length = 500 - 200 = 300m.",
    metadata: { difficulty: 0.50, subject: "Elementary Mathematics", topic: "Speed, Time & Distance" }
  },
  {
    id: "cds-math-3",
    text: "If sin(θ) + cos(θ) = √2 cos(θ), then what is the value of cos(θ) - sin(θ)?",
    options: { "A": "√2 sin(θ)", "B": "√2 cos(θ)", "C": "sin(θ)", "D": "1" },
    correct_answer: "A",
    explanation: "Given sin(θ) = (√2 - 1)cos(θ). Multiply both sides by (√2 + 1): (√2 + 1)sin(θ) = cos(θ). Hence cos(θ) - sin(θ) = √2 sin(θ).",
    metadata: { difficulty: 0.65, subject: "Elementary Mathematics", topic: "Trigonometric Identities" }
  },
  {
    id: "cds-math-4",
    text: "If the radius of a sphere is doubled, then its volume increases by what percentage?",
    options: { "A": "100%", "B": "400%", "C": "700%", "D": "800%" },
    correct_answer: "C",
    explanation: "Volume V ∝ r^3. If r becomes 2r, new volume V' = 8V. Increase = (8V - V)/V * 100 = 700%.",
    metadata: { difficulty: 0.45, subject: "Elementary Mathematics", topic: "Mensuration & Volume" }
  },

  // --- DEFENSE STUDIES & STRATEGIC AFFAIRS ---
  {
    id: "cds-def-1",
    text: "With reference to the Chief of Defence Staff (CDS) in India, consider the following statements:\n1. The CDS functions as the Permanent Chairman of the Chiefs of Staff Committee (COSC).\n2. The CDS heads the Department of Military Affairs (DMA) created under the Ministry of Defence.\n3. The CDS exercises direct operational battlefield command over individual service battalions.\n\nWhich of the statements given above are correct?",
    options: { "A": "1 and 2 only", "B": "2 and 3 only", "C": "1 and 3 only", "D": "1, 2 and 3" },
    correct_answer: "A",
    explanation: "The CDS is Permanent Chairman of COSC and Secretary of DMA. Operational command remains with the respective Service Chiefs.",
    metadata: { difficulty: 0.60, subject: "Defense Studies", topic: "Higher Defense Organization & CDS" }
  },
  {
    id: "cds-def-2",
    text: "Project 15B class of the Indian Navy refers to which of the following combat platforms?\n1. Nuclear-powered attack submarines (SSN)\n2. Stealth guided-missile destroyers (Visakhapatnam-class)\n3. Fleet replenishment tankers\n4. Anti-submarine warfare shallow water crafts",
    options: { "A": "1", "B": "2", "C": "3", "D": "4" },
    correct_answer: "B",
    explanation: "Project 15B is the Visakhapatnam-class stealth guided-missile destroyers constructed by Mazagon Dock Shipbuilders Limited (MDL).",
    metadata: { difficulty: 0.50, subject: "Defense Studies", topic: "Naval Doctrine & Project 15B" }
  },
  {
    id: "cds-def-3",
    text: "Operation Meghdoot, executed by the Indian Armed Forces in April 1984, was launched to secure control over which strategic sector?\n1. Sir Creek Marshlands\n2. Siachen Glacier & Saltoro Ridge\n3. Kargil Batalik Heights\n4. Pangong Tso North Bank",
    options: { "A": "1", "B": "2", "C": "3", "D": "4" },
    correct_answer: "B",
    explanation: "Operation Meghdoot was launched on 13 April 1984 under Lt. Gen. P.N. Hoon to establish Indian control over the highest battlefield on Earth (Siachen Glacier).",
    metadata: { difficulty: 0.45, subject: "Defense Studies", topic: "Military History & Strategic Operations" }
  },

  // --- GENERAL KNOWLEDGE & GEOGRAPHY ---
  {
    id: "cds-gk-1",
    text: "The Tropic of Cancer (23.5° N latitude) passes through how many Indian States?",
    options: { "A": "6 States", "B": "7 States", "C": "8 States", "D": "9 States" },
    correct_answer: "C",
    explanation: "Tropic of Cancer passes through 8 Indian states from west to east: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.",
    metadata: { difficulty: 0.40, subject: "General Knowledge", topic: "Indian Physical Geography" }
  },

  // --- ENGLISH LANGUAGE ---
  {
    id: "cds-eng-1",
    text: "Identify the antonym of the word 'EVALUATE' in the context of academic validation.",
    options: { "A": "Ignore", "B": "Assess", "C": "Measure", "D": "Appraise" },
    correct_answer: "A",
    explanation: "'Evaluate' means to judge, assess, or calculate the value. Its direct opposite is 'Ignore'.",
    metadata: { difficulty: 0.40, subject: "English", topic: "Vocabulary & Antonyms" }
  },
  {
    id: "cds-eng-2",
    text: "Fill in the blank with the appropriate preposition: 'The young officer was posted ___ the Western Border Command.'",
    options: { "A": "at", "B": "to", "C": "in", "D": "with" },
    correct_answer: "B",
    explanation: "Military convention dictates that personnel are posted 'to' a command or unit location.",
    metadata: { difficulty: 0.40, subject: "English", topic: "Prepositions & Grammar" }
  }
];

export function generateQuestionBank(
  examType: "UPSC" | "CDS", 
  subject: string = "All", 
  count: number = 25,
  year?: number,
  paper?: string,
  session?: string
): Question[] {
  const basePool = examType === "CDS" ? BASE_CDS_QUESTIONS : BASE_UPSC_QUESTIONS;
  
  const subLower = (subject || "").trim().toLowerCase();

  let filtered: Question[] = [];

  if (!subLower || subLower === "all" || subLower === "all subjects" || subLower === "whole paper") {
    filtered = basePool;
  } else {
    filtered = basePool.filter(q => {
      const qSub = (q.metadata?.subject || "").toLowerCase();
      const qTopic = (q.metadata?.topic || "").toLowerCase();
      const qText = q.text.toLowerCase();

      if (subLower.includes("polity")) {
        return qSub.includes("polity") || qTopic.includes("polity") || qTopic.includes("governor") || qTopic.includes("preamble");
      }
      if (subLower.includes("hist")) {
        return qSub.includes("hist") || qTopic.includes("chronology") || qTopic.includes("reforms") || qTopic.includes("round table");
      }
      if (subLower.includes("econ")) {
        return qSub.includes("econ") || qTopic.includes("monetary") || qTopic.includes("repo") || qTopic.includes("deficit");
      }
      if (subLower.includes("geo") || subLower.includes("env")) {
        return qSub.includes("geo") || qSub.includes("env") || qTopic.includes("western ghats") || qTopic.includes("monsoon");
      }
      if (subLower.includes("math") || subLower.includes("quant") || subLower.includes("trig")) {
        return qSub.includes("math") || qTopic.includes("geometry") || qTopic.includes("speed") || qTopic.includes("trigonometric");
      }
      if (subLower.includes("def") || subLower.includes("security") || subLower.includes("military")) {
        return qSub.includes("def") || qTopic.includes("defense") || qTopic.includes("naval") || qTopic.includes("operation");
      }
      if (subLower.includes("eng") || subLower.includes("gram")) {
        return qSub.includes("eng") || qTopic.includes("vocab") || qTopic.includes("preposition");
      }
      if (subLower.includes("gk") || subLower.includes("general knowledge")) {
        return qSub.includes("gk") || qSub.includes("general knowledge") || qSub.includes("geography");
      }
      return qSub.includes(subLower) || qTopic.includes(subLower) || qText.includes(subLower);
    });
  }

  const pool = filtered.length > 0 ? filtered : basePool;

  const result: Question[] = [];
  for (let i = 0; i < count; i++) {
    const template = pool[i % pool.length];
    const itemYear = year || template.metadata?.year || 2026;
    const itemSession = examType === "CDS" ? (session || template.metadata?.session || "I") : undefined;
    const itemPaper = paper || template.metadata?.paper || (examType === "UPSC" ? "Paper-I" : "General Knowledge & Maths");
    
    const sourceLabel = examType === "CDS"
      ? `CDS ${itemYear}${itemSession ? ` ${itemSession}` : ""}`
      : `UPSC CSE ${itemYear}`;

    result.push({
      ...template,
      id: `${examType.toLowerCase()}-${year ? year : "sim"}-${itemSession ? itemSession.toLowerCase() + "-" : ""}q-${i + 1}`,
      text: template.text,
      metadata: {
        ...template.metadata,
        difficulty: template.metadata?.difficulty ?? 0.50,
        subject: template.metadata?.subject || (examType === "UPSC" ? "Indian Polity" : "Elementary Mathematics"),
        topic: template.metadata?.topic,
        year: itemYear,
        session: itemSession,
        paper: itemPaper,
        source: year ? sourceLabel : template.metadata?.source || "Calibrated Question Bank"
      }
    });
  }
  return result;
}
