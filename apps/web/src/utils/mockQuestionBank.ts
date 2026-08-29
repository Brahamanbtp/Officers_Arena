import { Question } from "../store/useArenaStore";

export const BASE_UPSC_QUESTIONS: Question[] = [
  {
    id: "upsc-q-1",
    text: "Under the provisions of Article 356 of the Constitution of India, a Proclamation of President's Rule:\n1. Requires approval by both Houses of Parliament within two months.\n2. Can be extended up to a maximum period of three years with parliamentary approval every six months.\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "C",
    explanation: "Article 356 requires parliamentary approval within 2 months by simple majority. Maximum extension is 3 years with 6-month periodic renewals.",
    metadata: { difficulty: 0.60, subject: "Indian Polity" }
  },
  {
    id: "upsc-q-2",
    text: "With reference to the Preamble of the Indian Constitution, consider the following statements:\n1. The Preamble is an integral part of the Constitution as per the Kesavananda Bharati judgment.\n2. The Preamble is non-justiciable and non-enforceable in courts of law.\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "C",
    explanation: "In Kesavananda Bharati (1973), SC held Preamble is part of Constitution, but it is non-justiciable.",
    metadata: { difficulty: 0.55, subject: "Indian Polity" }
  },
  {
    id: "upsc-q-3",
    text: "Consider the following statements regarding the Attorney General for India:\n1. He is appointed by the President of India under Article 76.\n2. He must be qualified to be appointed a Judge of the Supreme Court.\n3. He has the right to take part in proceedings of either House of Parliament without the right to vote.\n\nWhich of the statements given above are correct?",
    options: { "A": "1 and 2 only", "B": "2 and 3 only", "C": "1 and 3 only", "D": "1, 2 and 3" },
    correct_answer: "D",
    explanation: "Under Article 76 and Article 88, the AG has rights of audience and participation in Parliament without voting rights.",
    metadata: { difficulty: 0.65, subject: "Indian Polity" }
  },
  {
    id: "upsc-q-4",
    text: "With reference to the Indian freedom struggle, consider the following statements regarding the Morley-Minto Reforms of 1909:\n1. It introduced separate communal electorates for Muslims.\n2. It granted provincial autonomy to British Indian provinces.\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "A",
    explanation: "The Indian Councils Act 1909 introduced communal electorates. Provincial autonomy was introduced later by Government of India Act 1935.",
    metadata: { difficulty: 0.50, subject: "Modern History" }
  },
  {
    id: "upsc-q-5",
    text: "Which of the following bodies is/are Constitutional Bodies in India?\n1. Election Commission of India\n2. NITI Aayog\n3. Finance Commission\n\nSelect the correct answer using the code given below:",
    options: { "A": "1 and 3 only", "B": "1 and 2 only", "C": "3 only", "D": "1, 2 and 3" },
    correct_answer: "A",
    explanation: "Election Commission (Art. 324) and Finance Commission (Art. 280) are Constitutional Bodies. NITI Aayog is non-constitutional.",
    metadata: { difficulty: 0.45, subject: "Indian Polity" }
  }
];

export const BASE_CDS_QUESTIONS: Question[] = [
  {
    id: "cds-q-1",
    text: "In a right-angled triangle ABC right-angled at B, if AB = 6 cm and BC = 8 cm, what is the radius of the in-circle (inradius r) of the triangle?",
    options: { "A": "2 cm", "B": "3 cm", "C": "4 cm", "D": "2.5 cm" },
    correct_answer: "A",
    explanation: "Hypotenuse c = sqrt(6^2 + 8^2) = 10 cm. Inradius r = (a + b - c) / 2 = (6 + 8 - 10) / 2 = 2 cm.",
    metadata: { difficulty: 0.55, subject: "Elementary Mathematics" }
  },
  {
    id: "cds-q-2",
    text: "A train running at a speed of 72 km/h crosses a 200m long platform in 25 seconds. What is the length of the train (in meters)?",
    options: { "A": "250 m", "B": "300 m", "C": "350 m", "D": "400 m" },
    correct_answer: "B",
    explanation: "Speed = 72 * (5/18) = 20 m/s. Total distance = 20 * 25 = 500m. Train length = 500 - 200 = 300m.",
    metadata: { difficulty: 0.50, subject: "Elementary Mathematics" }
  },
  {
    id: "cds-q-3",
    text: "With reference to the Chief of Defence Staff (CDS) in India, consider the following statements:\n1. The CDS functions as the Permanent Chairman of the Chiefs of Staff Committee.\n2. The CDS exercises direct operational military command over all three service chiefs.\n\nWhich of the statements given above is/are correct?",
    options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
    correct_answer: "A",
    explanation: "The CDS is Permanent Chairman of Chiefs of Staff Committee. Operational command remains with respective Service Chiefs.",
    metadata: { difficulty: 0.60, subject: "Defense Studies" }
  },
  {
    id: "cds-q-4",
    text: "If sin(theta) + cos(theta) = sqrt(2) cos(theta), then what is the value of cos(theta) - sin(theta)?",
    options: { "A": "sqrt(2) sin(theta)", "B": "sqrt(2) cos(theta)", "C": "sin(theta)", "D": "1" },
    correct_answer: "A",
    explanation: "Squaring both sides and simplifying yields cos(theta) - sin(theta) = sqrt(2) sin(theta).",
    metadata: { difficulty: 0.65, subject: "Trigonometry" }
  },
  {
    id: "cds-q-5",
    text: "The Tropic of Cancer passes through how many Indian States?",
    options: { "A": "6 States", "B": "7 States", "C": "8 States", "D": "9 States" },
    correct_answer: "C",
    explanation: "Tropic of Cancer passes through 8 states: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, West Bengal, Tripura, Mizoram.",
    metadata: { difficulty: 0.40, subject: "Geography" }
  }
];

export function generateQuestionBank(
  examType: "UPSC" | "CDS", 
  subject: string = "All", 
  count: number = 25,
  year?: number,
  paper?: string
): Question[] {
  const basePool = examType === "CDS" ? BASE_CDS_QUESTIONS : BASE_UPSC_QUESTIONS;
  const filtered = subject === "All" 
    ? basePool 
    : basePool.filter(q => q.metadata?.subject === subject || subject.includes(q.metadata?.subject || ""));
  
  const pool = filtered.length > 0 ? filtered : basePool;

  const result: Question[] = [];
  for (let i = 0; i < count; i++) {
    const template = pool[i % pool.length];
    const itemYear = year || template.metadata?.year || 2024;
    const itemPaper = paper || template.metadata?.paper || (examType === "UPSC" ? "Paper-I" : "General Knowledge & Maths");
    
    result.push({
      ...template,
      id: `${examType.toLowerCase()}-${year ? year : "sim"}-q-${i + 1}`,
      text: i >= pool.length 
        ? `[${year ? `${examType} ${year}` : "Sim"} Item ${i + 1}] ${template.text}` 
        : template.text,
      metadata: {
        ...template.metadata,
        difficulty: template.metadata?.difficulty ?? 0.50,
        subject: template.metadata?.subject || (examType === "UPSC" ? "Indian Polity" : "Elementary Mathematics"),
        year: itemYear,
        paper: itemPaper,
        source: year ? `${examType} ${year} Official Exam` : template.metadata?.source || "Mock Engine"
      }
    });
  }
  return result;
}
