"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppHeader } from "@/src/components/shared/AppHeader";
import { AppFooter } from "@/src/components/shared/AppFooter";
import { GuestWarningBanner } from "@/src/components/auth/GuestWarningBanner";
import { MathMarkdown } from "@/src/components/shared/MathMarkdown";
import {
  PenTool,
  Clock,
  Award,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Loader2,
  RefreshCw,
  FileText,
  Sliders,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Layers,
  Maximize2,
  Minimize2,
  ListFilter,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Check
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from "recharts";
import { toast } from "sonner";
import { SocraticBoardroom } from "@/src/components/boardroom/SocraticBoardroom";

interface MainsQuestion {
  id: string;
  text: string;
  year: number;
  subject: string;
  max_marks: number;
  word_limit: number;
  directive: string;
}

interface MainsCitation {
  book_title: string;
  author: string;
  page_number: number;
  chapter_title: string;
  relevant_concept: string;
}

interface MainsEvaluation {
  question_text: string;
  directive_type: string;
  word_count: number;
  time_taken_seconds?: number;
  rubrics: {
    directive_adherence: number;
    factual_grounding: number;
    pestle_coverage: number;
    structural_flow: number;
    way_forward: number;
    total_score: number;
    max_marks: number;
  };
  radar_data: Array<{ dimension: string; score: number; fullMark: number }>;
  pestle_breakdown: Record<string, boolean>;
  strengths: string[];
  identified_gaps: string[];
  missing_key_citations: MainsCitation[];
  model_answer_outline: Record<string, string>;
  overall_verdict: string;
  evaluation_mode?: string;
}

const SAMPLE_MAINS_QUESTIONS: MainsQuestion[] = [
  // --- ESSAY PAPERS (2014 - 2024) ---
  {
    id: "mains-essay-2024-1",
    text: "Wisdom finds truth; courage protects it: The ethical imperative of leadership in democratic governance. (1000-1200 words, 125 marks)",
    year: 2024,
    subject: "Essay Paper (Section A - Philosophical)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Multi-dimensional philosophical and empirical exposition)"
  },
  {
    id: "mains-essay-2024-2",
    text: "Technology is a useful servant but a dangerous master in constitutional democracies. (1000-1200 words, 125 marks)",
    year: 2024,
    subject: "Essay Paper (Section B - Socio-Technological)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Multi-dimensional philosophical and empirical exposition)"
  },
  {
    id: "mains-essay-2023-1",
    text: "Thinking is like a game, it does not begin unless there is an opposite team. (1000-1200 words, 125 marks)",
    year: 2023,
    subject: "Essay Paper (Section A - Philosophical)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Dialectical analysis of thought, dissent, and intellectual progress)"
  },
  {
    id: "mains-essay-2023-2",
    text: "Education is what remains after one has forgotten what one has learned in school. (1000-1200 words, 125 marks)",
    year: 2023,
    subject: "Essay Paper (Section B - Human Capital & Values)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Character building, critical thinking, and lifelong ethical learning)"
  },
  {
    id: "mains-essay-2022-1",
    text: "Forests are the best case studies for economic excellence. (1000-1200 words, 125 marks)",
    year: 2022,
    subject: "Essay Paper (Section A - Ecological Economics)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Symbiosis, sustainability, resource allocation, and circular economy)"
  },
  {
    id: "mains-essay-2022-2",
    text: "Poets are the unacknowledged legislators of the world. (1000-1200 words, 125 marks)",
    year: 2022,
    subject: "Essay Paper (Section B - Cultural & Moral Leadership)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Role of art, literature, and empathy in shaping public conscience)"
  },
  {
    id: "mains-essay-2021-1",
    text: "The real is rational and the rational is real: Evaluating modern political and economic choices. (1000-1200 words, 125 marks)",
    year: 2021,
    subject: "Essay Paper (Section A - Philosophical)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Hegelian synthesis applied to institutional and developmental reality)"
  },
  {
    id: "mains-essay-2021-2",
    text: "History is a series of victories won by the scientific man over the romantic man. (1000-1200 words, 125 marks)",
    year: 2021,
    subject: "Essay Paper (Section B - Scientific Enlightenment)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Scientific temper, technological triumphs, and humanistic balancing)"
  },
  {
    id: "mains-essay-2020-1",
    text: "Courage to accept and dedication to improve are two keys to success. (1000-1200 words, 125 marks)",
    year: 2020,
    subject: "Essay Paper (Section A - Personal Ethics)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Self-reflection, institutional resilience, and reformative courage)"
  },
  {
    id: "mains-essay-2019-1",
    text: "South Asian society is not bonded by state but by cultural heritage and shared values. (1000-1200 words, 125 marks)",
    year: 2019,
    subject: "Essay Paper (Section B - Civilizational Unity)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Civilizational continuum vs geopolitical boundaries in South Asia)"
  },
  {
    id: "mains-essay-2018-1",
    text: "Farming has lost the ability to be a source of subsistence for majority of farmers in India. (1000-1200 words, 125 marks)",
    year: 2018,
    subject: "Essay Paper (Section B - Agrarian Economy)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Agrarian distress, land fragmentation, and rural value chains)"
  },
  {
    id: "mains-essay-2017-1",
    text: "Fulfillment of 'new woman' in India is a myth. (1000-1200 words, 125 marks)",
    year: 2017,
    subject: "Essay Paper (Section A - Gender & Social Justice)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Patriarchal structures, glass ceilings, and substantive empowerment)"
  },
  {
    id: "mains-essay-2016-1",
    text: "If development is not engendered, it is endangered. (1000-1200 words, 125 marks)",
    year: 2016,
    subject: "Essay Paper (Section B - Gender & Development)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Inclusive growth, female labor force participation, and gender budgeting)"
  },
  {
    id: "mains-essay-2015-1",
    text: "Dreams which do not let you sleep are the true catalysts of national transformation. (1000-1200 words, 125 marks)",
    year: 2015,
    subject: "Essay Paper (Section A - Visionary Leadership)",
    max_marks: 125,
    word_limit: 1000,
    directive: "Essay (Vision, youth energy, and national developmental mission)"
  },

  // --- GENERAL STUDIES - I (2015 - 2024) ---
  {
    id: "mains-gs1-art-2024",
    text: "Explain the salient features of Gandhara and Mathura schools of art and analyze their distinctive contributions to Buddhist iconography. (150 words, 10 marks)",
    year: 2024,
    subject: "General Studies Paper - I (Art & Culture)",
    max_marks: 10,
    word_limit: 150,
    directive: "Explain & Analyze (Clarify features with comparative synthesis)"
  },
  {
    id: "mains-gs1-history-2024",
    text: "The Swadeshi Movement of 1905 marked a radical paradigm shift from moderate constitutional agitation to mass direct action. Elucidate with reference to Boycott, Swadeshi enterprise, and National Education. (150 words, 10 marks)",
    year: 2024,
    subject: "General Studies Paper - I (Modern Indian History)",
    max_marks: 10,
    word_limit: 150,
    directive: "Elucidate (Requires clarifying core concepts with historical milestones)"
  },
  {
    id: "mains-gs1-geography-2024",
    text: "Account for the rising frequency of urban flooding in Indian mega-cities with special reference to drainage failure, wetland encroachment, and rapid land-use transformation. Suggest comprehensive mitigation measures. (250 words, 15 marks)",
    year: 2024,
    subject: "General Studies Paper - I (Physical & Human Geography)",
    max_marks: 15,
    word_limit: 250,
    directive: "Account for & Suggest (Root cause analysis with actionable roadmap)"
  },
  {
    id: "mains-gs1-society-2023",
    text: "Discuss the impact of the gig economy and digital platform work on traditional family structures, gender participation, and social security in contemporary India. (150 words, 10 marks)",
    year: 2023,
    subject: "General Studies Paper - I (Indian Society)",
    max_marks: 10,
    word_limit: 150,
    directive: "Discuss (Balanced multi-dimensional exploration)"
  },
  {
    id: "mains-gs1-history-2022",
    text: "Why did the armies of the British East India Company—mostly comprising Indian soldiers—win consistently against the much more numerous and better-equipped armies of the Indian rulers? (150 words, 10 marks)",
    year: 2022,
    subject: "General Studies Paper - I (Modern Indian History)",
    max_marks: 10,
    word_limit: 150,
    directive: "Analyze (Dissect organizational, financial, and military discipline factors)"
  },
  {
    id: "mains-gs1-geo-2021",
    text: "Differentiate between the causes and spatial impacts of tropical cyclones in the Bay of Bengal versus the Arabian Sea with special reference to recent warming trends. (250 words, 15 marks)",
    year: 2021,
    subject: "General Studies Paper - I (Climatology & Oceanography)",
    max_marks: 15,
    word_limit: 250,
    directive: "Differentiate & Assess (Climatic comparison with SST trends)"
  },
  {
    id: "mains-gs1-society-2020",
    text: "Is diversity and pluralism under threat due to the forces of globalization in contemporary Indian society? Substantiate your answer with sociological arguments. (250 words, 15 marks)",
    year: 2020,
    subject: "General Studies Paper - I (Indian Society)",
    max_marks: 15,
    word_limit: 250,
    directive: "Substantiate (Sociological critique of cultural homogenization)"
  },
  {
    id: "mains-gs1-history-2018",
    text: "Throw light on the significance of the thoughts of Mahatma Gandhi in the present times, particularly regarding environmental sustainability, decentralization, and non-violent conflict resolution. (150 words, 10 marks)",
    year: 2018,
    subject: "General Studies Paper - I (Modern Indian History & Philosophy)",
    max_marks: 10,
    word_limit: 150,
    directive: "Evaluate (Contemporary relevance of Gandhian philosophy)"
  },

  // --- GENERAL STUDIES - II (2015 - 2024) ---
  {
    id: "mains-gs2-polity-2024",
    text: "Critically analyze the role of the Governor in the Indian Constitutional framework, particularly regarding the exercise of discretionary powers under Article 163 and Article 200. Does it undermine the federal balance? (150 words, 10 marks)",
    year: 2024,
    subject: "General Studies Paper - II (Polity & Governance)",
    max_marks: 10,
    word_limit: 150,
    directive: "Critically Analyze (Requires pros, cons, evidence & objective synthesis)"
  },
  {
    id: "mains-gs2-judiciary-2024",
    text: "The doctrine of Basic Structure has evolved as a fundamental constitutional safeguard against majoritarian overreach. Examine its development from Shankari Prasad to Minerva Mills and its relevance to judicial review today. (250 words, 15 marks)",
    year: 2024,
    subject: "General Studies Paper - II (Constitution & Judiciary)",
    max_marks: 15,
    word_limit: 250,
    directive: "Examine (Detailed judicial analysis and constitutional implications)"
  },
  {
    id: "mains-gs2-governance-2023",
    text: "Evaluate the efficacy of digital governance platforms (such as Direct Benefit Transfer and Jan Dhan-Aadhaar-Mobile trinity) in plugging leakages and enhancing transparency in welfare administration. (150 words, 10 marks)",
    year: 2023,
    subject: "General Studies Paper - II (Governance & Public Policy)",
    max_marks: 10,
    word_limit: 150,
    directive: "Evaluate (Assess outcomes against targeted policy goals)"
  },
  {
    id: "mains-gs2-ir-2024",
    text: "India's strategic autonomy in a multipolar global order requires delicate balancing between Western partnerships and Eurasian connectivity. Analyze with reference to QUAD and BRICS. (250 words, 15 marks)",
    year: 2024,
    subject: "General Studies Paper - II (International Relations)",
    max_marks: 15,
    word_limit: 250,
    directive: "Analyze (Dissect geopolitical forces and strategic imperatives)"
  },
  {
    id: "mains-gs2-fed-2022",
    text: "Fiscal Federalism in India has undergone significant transformation after the introduction of GST and the reconstitution of the Planning Commission into NITI Aayog. Discuss the challenges faced by states in revenue mobilization. (250 words, 15 marks)",
    year: 2022,
    subject: "General Studies Paper - II (Federalism & Public Finance)",
    max_marks: 15,
    word_limit: 250,
    directive: "Discuss (Analysis of vertical and horizontal fiscal devolution)"
  },
  {
    id: "mains-gs2-repr-2021",
    text: "Analyze the salient provisions of the Representation of the People Act, 1951 regarding the disqualification of convicted elected representatives and inner-party democracy. (150 words, 10 marks)",
    year: 2021,
    subject: "General Studies Paper - II (Electoral Reforms & RPA)",
    max_marks: 10,
    word_limit: 150,
    directive: "Analyze (Statutory mechanisms and Supreme Court landmark rulings)"
  },
  {
    id: "mains-gs2-bodies-2019",
    text: "The Election Commission of India has been a pillar of Indian democracy, yet concerns regarding model code enforcement and transparency of electoral bonds warrant institutional strengthening. Comment. (250 words, 15 marks)",
    year: 2019,
    subject: "General Studies Paper - II (Constitutional Bodies & ECI)",
    max_marks: 15,
    word_limit: 250,
    directive: "Comment (Evaluation of institutional autonomy and reforms)"
  },

  // --- GENERAL STUDIES - III (2015 - 2024) ---
  {
    id: "mains-gs3-economy-2024",
    text: "Discuss the structural challenges of External Benchmark Lending Rate (EBLR) in achieving seamless monetary policy transmission in India. Suggest pragmatic reforms to improve credit flow to MSMEs. (250 words, 15 marks)",
    year: 2024,
    subject: "General Studies Paper - III (Economy & Development)",
    max_marks: 15,
    word_limit: 250,
    directive: "Discuss (Requires balanced, multi-faceted exploration of all dimensions)"
  },
  {
    id: "mains-gs3-environment-2024",
    text: "Assess the role of green hydrogen in decarbonizing hard-to-abate industrial sectors (steel, cement, fertilizers) under India's National Green Hydrogen Mission. (150 words, 10 marks)",
    year: 2024,
    subject: "General Studies Paper - III (Environment & Climate Change)",
    max_marks: 10,
    word_limit: 150,
    directive: "Assess (Evaluate feasibility, economic costs, and carbon offset potential)"
  },
  {
    id: "mains-gs3-tech-2024",
    text: "What are the ethical, intellectual property, and cybersecurity risks associated with the proliferation of Generative Artificial Intelligence foundation models? How should national AI regulation balance innovation with accountability? (250 words, 15 marks)",
    year: 2024,
    subject: "General Studies Paper - III (Science & Technology)",
    max_marks: 15,
    word_limit: 250,
    directive: "Examine & Suggest (Technological risk assessment and regulatory framework)"
  },
  {
    id: "mains-gs3-security-2023",
    text: "Cross-border drone intrusions and asymmetric cyber warfare pose severe challenges to India's internal and border security. Outline a multi-layered indigenous defense and surveillance architecture. (150 words, 10 marks)",
    year: 2023,
    subject: "General Studies Paper - III (Internal Security & Defense)",
    max_marks: 10,
    word_limit: 150,
    directive: "Outline (Structured operational and policy architecture)"
  },
  {
    id: "mains-gs3-agri-2022",
    text: "What are the major constraints in transport and marketing of agricultural produce in India? How can e-NAM and Direct-to-Farmer supply chains overcome middleman cartelization? (250 words, 15 marks)",
    year: 2022,
    subject: "General Studies Paper - III (Agriculture & APMC Reforms)",
    max_marks: 15,
    word_limit: 250,
    directive: "Analyze & Suggest (Supply chain bottlenecks and digital solutions)"
  },
  {
    id: "mains-gs3-inclusive-2020",
    text: "Explain the meaning of investment in an economy in terms of capital formation. How does high public capital expenditure crowd-in private investments? (150 words, 10 marks)",
    year: 2020,
    subject: "General Studies Paper - III (Macroeconomics & Capital Formation)",
    max_marks: 10,
    word_limit: 150,
    directive: "Explain & Illustrate (Economic multiplier effect and fiscal transmission)"
  },

  // --- GENERAL STUDIES - IV (2015 - 2024) ---
  {
    id: "mains-gs4-ethics-2024",
    text: "Explain the concept of 'Constitutional Morality' as propounded by Dr. B.R. Ambedkar and its modern administrative application in upholding civil service neutrality and integrity. (150 words, 10 marks)",
    year: 2024,
    subject: "General Studies Paper - IV (Ethics & Integrity)",
    max_marks: 10,
    word_limit: 150,
    directive: "Explain (Philosophical concept with practical administrative examples)"
  },
  {
    id: "mains-gs4-integrity-2024",
    text: "Conflict of interest among public servants is both an ethical dilemma and a threat to governance. Distinguish between actual, potential, and perceived conflict of interest with real-world public administration scenarios. (150 words, 10 marks)",
    year: 2024,
    subject: "General Studies Paper - IV (Ethics & Probity)",
    max_marks: 10,
    word_limit: 150,
    directive: "Distinguish & Illustrate (Conceptual taxonomy with practical cases)"
  },
  {
    id: "mains-gs4-case-2024",
    text: "You are a District Magistrate heading disaster relief during severe floods. Local political figures insist on diverting high-value relief packets to unaffected vote-bank areas. Assess the ethical options available and state your course of action with justifications. (250 words, 20 marks)",
    year: 2024,
    subject: "General Studies Paper - IV (Applied Ethics Case Study)",
    max_marks: 20,
    word_limit: 250,
    directive: "Evaluate & Decide (Ethical dilemma resolution under pressure)"
  },
  {
    id: "mains-gs4-values-2022",
    text: "What does this quotation mean to you in the present context: 'An unexamined life is not worth living.' - Socrates. (150 words, 10 marks)",
    year: 2022,
    subject: "General Studies Paper - IV (Ethical Thinkers & Philosophers)",
    max_marks: 10,
    word_limit: 150,
    directive: "Elucidate (Self-introspection, conscience, and ethical accountability)"
  },
  {
    id: "mains-gs4-emotional-2021",
    text: "What is emotional intelligence and how can it be practically utilized by a civil servant handling communal tension in a sensitive district? (150 words, 10 marks)",
    year: 2021,
    subject: "General Studies Paper - IV (Emotional Intelligence & Administration)",
    max_marks: 10,
    word_limit: 150,
    directive: "Illustrate (Empathy, de-escalation, and composure under extreme stress)"
  },
  {
    id: "mains-gs4-case-2020",
    text: "A whistleblowing junior engineer brings to your notice that substandard concrete is being used in a major public flyover construction sanctioned by a powerful minister. What are the ethical options and your course of action? (250 words, 20 marks)",
    year: 2020,
    subject: "General Studies Paper - IV (Applied Ethics Case Study)",
    max_marks: 20,
    word_limit: 250,
    directive: "Analyze & Act (Public safety vs administrative hierarchy dilemma)"
  }
];

export default function MainsEvaluationPage() {
  const [questions, setQuestions] = useState<MainsQuestion[]>(SAMPLE_MAINS_QUESTIONS);
  const [selectedQuestion, setSelectedQuestion] = useState<MainsQuestion>(SAMPLE_MAINS_QUESTIONS[0]);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [mainsStudioTab, setMainsStudioTab] = useState<"written" | "boardroom">("written");
  const [selectedPaper, setSelectedPaper] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Input Method: "ocr" (Handwritten sheet photo) is default for physical authentic practice
  const [inputMode, setInputMode] = useState<"typed" | "ocr">("ocr");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile responsive view tabs
  const [mobileTab, setMobileTab] = useState<"questions" | "editor" | "rubric">("editor");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer & Metrics
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // AES Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<MainsEvaluation | null>(null);

  // Fetch official mains questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      try {
        const queryPaper = selectedPaper !== "ALL" ? `&paper=${selectedPaper}` : "";
        const queryYear = selectedYear ? `&year=${selectedYear}` : "";
        const res = await fetch(`${apiEndpoint}/api/v1/mains/questions?limit=50${queryPaper}${queryYear}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setQuestions(data);
            setSelectedQuestion(data[0]);
            return;
          }
        }
      } catch {
        // Fallback to local sample questions
      }
      let filteredFallback = selectedPaper === "ALL" 
        ? SAMPLE_MAINS_QUESTIONS 
        : SAMPLE_MAINS_QUESTIONS.filter(q => matchesPaper(q.subject, selectedPaper));
      if (selectedYear) {
        filteredFallback = filteredFallback.filter(q => q.year === selectedYear);
      }
      setQuestions(filteredFallback.length > 0 ? filteredFallback : SAMPLE_MAINS_QUESTIONS);
      if (filteredFallback.length > 0) {
        setSelectedQuestion(filteredFallback[0]);
      }
    };
    fetchQuestions();
  }, [selectedPaper, selectedYear]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const wordCount = studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0;
  const targetWordLimit = selectedQuestion.word_limit || 150;
  const isWordCountOptimal = wordCount >= targetWordLimit * 0.85 && wordCount <= targetWordLimit * 1.15;

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartWriting = () => {
    setIsTimerRunning(true);
    setTimerSeconds(0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      toast.success("Handwritten answer sheet selected", {
        description: `${file.name} (${(file.size / 1024).toFixed(0)} KB)`
      });
    }
  };

  const handleEvaluateAnswer = async () => {
    setIsEvaluating(true);
    setIsTimerRunning(false);

    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      if (inputMode === "ocr" && selectedImage) {
        // OCR Handwritten Sheet Evaluation
        const formData = new FormData();
        formData.append("question_text", selectedQuestion.text);
        formData.append("max_marks", selectedQuestion.max_marks.toString());
        if (timerSeconds > 0) {
          formData.append("time_taken_seconds", timerSeconds.toString());
        }
        formData.append("file", selectedImage);

        const res = await fetch(`${apiEndpoint}/api/v1/mains/evaluate-ocr`, {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setStudentAnswer(data.transcribed_text);
          setEvaluationResult(data.evaluation);
          setMobileTab("rubric");
          toast.success("Handwritten Sheet Transcribed & Evaluated!", {
            description: `Score: ${data.evaluation.rubrics.total_score} / ${data.evaluation.rubrics.max_marks} Marks`
          });
        } else {
          toast.error("OCR evaluation failed. Please try again with a clear photo.");
        }
      } else {
        // Typed Text Evaluation
        if (wordCount < 20) {
          toast.error("Answer too short! Write at least 20 words for a meaningful evaluation.");
          setIsEvaluating(false);
          return;
        }

        const res = await fetch(`${apiEndpoint}/api/v1/mains/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: selectedQuestion.id,
            question_text: selectedQuestion.text,
            student_answer: studentAnswer,
            max_marks: selectedQuestion.max_marks,
            time_taken_seconds: timerSeconds
          })
        });

        if (res.ok) {
          const data = await res.json();
          setEvaluationResult(data);
          setMobileTab("rubric");
          toast.success("Mains Answer Evaluated Successfully!", {
            description: `Score: ${data.rubrics.total_score} / ${data.rubrics.max_marks} Marks`
          });
        } else {
          toast.error("Evaluation service error. Please try again.");
        }
      }
    } catch {
      toast.error("Could not connect to evaluation server.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const matchesPaper = (subjectStr: string, paperKey: string) => {
    if (paperKey === "ALL") return true;
    const s = subjectStr.toLowerCase();
    if (paperKey === "GS1") {
      return (s.includes("paper - i (") || s.includes("paper-1") || s.includes("paper 1") || s.includes("gs1") || s.includes("gs-1") || s.includes("art & culture") || s.includes("history") || s.includes("geography") || s.includes("society")) && !s.includes("paper - ii") && !s.includes("paper - iii") && !s.includes("paper - iv");
    }
    if (paperKey === "GS2") {
      return (s.includes("paper - ii") || s.includes("paper-2") || s.includes("paper 2") || s.includes("gs2") || s.includes("gs-2") || s.includes("polity") || s.includes("governance") || s.includes("constitution") || s.includes("judiciary") || s.includes("international relations")) && !s.includes("paper - iii");
    }
    if (paperKey === "GS3") {
      return s.includes("paper - iii") || s.includes("paper-3") || s.includes("paper 3") || s.includes("gs3") || s.includes("gs-3") || s.includes("economy") || s.includes("environment") || s.includes("security") || s.includes("science") || s.includes("disaster");
    }
    if (paperKey === "GS4") {
      return s.includes("paper - iv") || s.includes("paper-4") || s.includes("paper 4") || s.includes("gs4") || s.includes("gs-4") || s.includes("ethics") || s.includes("integrity") || s.includes("probity") || s.includes("case study") || s.includes("aptitude");
    }
    if (paperKey === "Essay") {
      return s.includes("essay");
    }
    return s.includes(paperKey.toLowerCase());
  };

  const filteredQuestions = questions.filter((q) => {
    if (!matchesPaper(q.subject, selectedPaper)) {
      return false;
    }
    if (selectedYear && q.year !== selectedYear) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#080808] text-neutral-100">
      <GuestWarningBanner />
      <AppHeader />

      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Header Hero Banner */}
        <div className="bg-[#101010] border border-neutral-800 rounded-3xl p-5 md:p-7 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-amber-400" />
                UPSC Mains AES Evaluator
              </span>
              <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold rounded-lg">
                5-Axis Radar • PESTLE • Vision OCR
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Descriptive Answer Writing & Socratic Evaluation
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 max-w-3xl leading-relaxed">
              Official GS1–GS4 descriptive practice grounded in canonical reference textbooks (*M. Laxmikanth, Spectrum, Subhash Kashyap*).
            </p>
          </div>
        </div>

        {/* Master Mains Studio Tab Switcher */}
        <div className="flex items-center justify-between gap-2 p-1.5 bg-[#121212] border border-neutral-800 rounded-2xl">
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => setMainsStudioTab("written")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mainsStudioTab === "written"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-md"
                  : "bg-neutral-900 text-neutral-400 hover:text-white"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Written Answer Evaluator (AES &amp; OCR)</span>
              <span className="px-1.5 py-0.2 bg-neutral-950/40 text-[10px] rounded font-mono">GS1–GS4</span>
            </button>

            <button
              type="button"
              onClick={() => setMainsStudioTab("boardroom")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mainsStudioTab === "boardroom"
                  ? "bg-purple-600 text-white font-black shadow-md"
                  : "bg-neutral-900 text-neutral-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Socratic Boardroom (Oral Viva Defense)</span>
              <span className="px-1.5 py-0.2 bg-purple-500/30 text-purple-300 text-[10px] rounded font-mono">3 Examiners</span>
            </button>
          </div>
        </div>

        {/* TAB 1: WRITTEN AES WORKSPACE */}
        {mainsStudioTab === "written" && (
          <div className="space-y-6">
            {/* Paper & Subject Filters + Mobile Tab Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-[#121212] border border-neutral-800 rounded-2xl">
              
              {/* Paper Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {["ALL", "GS1", "GS2", "GS3", "GS4", "Essay"].map((paper) => (
                  <button
                    key={paper}
                    type="button"
                    onClick={() => setSelectedPaper(paper)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedPaper === paper
                        ? "bg-amber-600 text-neutral-950 font-black shadow-md"
                        : "bg-neutral-900 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {paper === "ALL" ? "All Papers" : paper}
                  </button>
                ))}
              </div>

              {/* Year Filter Pills / Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-neutral-400 font-bold hidden sm:inline-block">Year:</span>
                <select
                  value={selectedYear || ""}
                  onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">All Years (2014–2024)</option>
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

          {/* Mobile Screen Tab Toggle (Visible on < 1024px) */}
          <div className="flex lg:hidden items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMobileTab("questions")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mobileTab === "questions" ? "bg-amber-600 text-neutral-950" : "text-neutral-400"
              }`}
            >
              📝 Pick ({filteredQuestions.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("editor")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mobileTab === "editor" ? "bg-amber-600 text-neutral-950" : "text-neutral-400"
              }`}
            >
              ✍️ Write
            </button>
            {evaluationResult && (
              <button
                type="button"
                onClick={() => setMobileTab("rubric")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mobileTab === "rubric" ? "bg-purple-600 text-white" : "text-purple-400"
                }`}
              >
                📊 Score
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Responsive Multi-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column 1: Question Selection Drawer/List */}
          <div className={`lg:col-span-4 bg-[#121212] border border-neutral-800 p-4 sm:p-5 rounded-3xl space-y-3.5 shadow-xl max-h-[750px] overflow-y-auto scrollbar-thin ${
            mobileTab !== "questions" ? "hidden lg:block" : "block"
          }`}>
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center justify-between border-b border-neutral-800 pb-3">
              <span>Select Mains Prompt</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </h3>

            <div className="space-y-2.5">
              {filteredQuestions.map((q) => {
                const isSelected = selectedQuestion.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestion(q);
                      setStudentAnswer("");
                      setEvaluationResult(null);
                      setIsTimerRunning(false);
                      setTimerSeconds(0);
                      setSelectedImage(null);
                      setImagePreviewUrl(null);
                      setMobileTab("editor");
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5"
                        : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded font-mono text-amber-400 font-bold">
                        UPSC {q.year}
                      </span>
                      <span className="text-neutral-400 font-bold">
                        {q.max_marks}M • {q.word_limit}w
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 line-clamp-3 leading-relaxed font-serif">
                      {q.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Answer Writing Canvas */}
          <div className={`${
            evaluationResult ? "lg:col-span-4" : "lg:col-span-8"
          } bg-[#121212] border border-neutral-800 p-5 md:p-7 rounded-3xl space-y-5 shadow-xl ${
            mobileTab !== "editor" ? "hidden lg:block" : "block"
          } ${isFullscreen ? "fixed inset-4 z-50 bg-[#121212] overflow-y-auto" : ""}`}>
            
            {/* Active Question Prompt */}
            <div className="space-y-2.5 border-b border-neutral-800 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold rounded-lg font-mono">
                  {selectedQuestion.subject} • {selectedQuestion.year}
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-mono font-bold">
                    Target: {selectedQuestion.word_limit} Words ({selectedQuestion.max_marks}M)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Focus Mode"}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <h2 className="text-sm md:text-base font-bold text-white leading-relaxed font-serif">
                {selectedQuestion.text}
              </h2>

              <div className="p-2.5 bg-neutral-950 border border-neutral-800/80 rounded-xl text-xs text-neutral-300 flex items-start gap-2">
                <span className="text-amber-400 font-black">Directive:</span>
                <span className="text-neutral-300">{selectedQuestion.directive}</span>
              </div>
            </div>

            {/* Mode Switcher: Typed vs Handwritten OCR */}
            <div className="flex items-center gap-2 border-b border-neutral-800/60 pb-3">
              <button
                type="button"
                onClick={() => setInputMode("typed")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  inputMode === "typed"
                    ? "bg-amber-600 text-neutral-950 font-black"
                    : "bg-neutral-900 text-neutral-400 hover:text-white"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                Digital Keyboard
              </button>
              <button
                type="button"
                onClick={() => setInputMode("ocr")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  inputMode === "ocr"
                    ? "bg-purple-600 text-white font-black"
                    : "bg-neutral-900 text-neutral-400 hover:text-white"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Handwritten Sheet (Vision OCR)
              </button>
            </div>

            {/* Answer Input Canvas */}
            {inputMode === "typed" ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-neutral-400">Your Answer:</span>
                    <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                      isWordCountOptimal
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : wordCount > targetWordLimit * 1.2
                        ? "bg-red-500/20 text-red-300 border border-red-500/40"
                        : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                    }`}>
                      {wordCount} / {targetWordLimit} Words
                    </span>
                  </div>

                  {/* Stopwatch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-300 font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {formatTimer(timerSeconds)}
                    </span>
                    {!isTimerRunning && timerSeconds === 0 && (
                      <button
                        type="button"
                        onClick={handleStartWriting}
                        className="text-[10px] text-amber-400 hover:underline uppercase font-bold cursor-pointer"
                      >
                        Start Timer
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={studentAnswer}
                  onChange={(e) => {
                    setStudentAnswer(e.target.value);
                    if (!isTimerRunning && timerSeconds === 0) {
                      setIsTimerRunning(true);
                    }
                  }}
                  placeholder="Structure your answer (Contextual Introduction -> Multi-dimensional Body -> Case Law/Statutory Citations -> Constructive Way Forward)..."
                  rows={isFullscreen ? 22 : 12}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-all font-serif leading-relaxed"
                />
              </div>
            ) : (
              /* Handwritten Sheet Upload Dropzone */
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                {!imagePreviewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-700 hover:border-purple-500 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-neutral-950/60 hover:bg-neutral-950 transition-all text-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Upload Handwritten Answer Sheet</h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        Photograph your handwritten UPSC booklet page (JPG, PNG, WebP)
                      </p>
                    </div>
                    <span className="px-3 py-1.5 bg-neutral-900 text-neutral-300 rounded-xl text-xs font-bold border border-neutral-800">
                      Select Answer Photo
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-neutral-700 bg-neutral-950 max-h-60 flex items-center justify-center">
                      <img
                        src={imagePreviewUrl}
                        alt="Handwritten Sheet Preview"
                        className="object-contain max-h-60 w-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreviewUrl(null);
                        }}
                        className="absolute top-2 right-2 px-2.5 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold backdrop-blur-md"
                      >
                        Remove
                      </button>
                    </div>

                    {studentAnswer && (
                      <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                        <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Transcribed Text Preview
                        </span>
                        <p className="text-xs text-neutral-300 font-serif leading-relaxed line-clamp-3">
                          {studentAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submit Evaluation Action */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStudentAnswer("");
                  setEvaluationResult(null);
                  setTimerSeconds(0);
                  setIsTimerRunning(false);
                  setSelectedImage(null);
                  setImagePreviewUrl(null);
                }}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                disabled={isEvaluating || (inputMode === "typed" ? wordCount < 20 : !selectedImage)}
                onClick={handleEvaluateAnswer}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-xl flex items-center gap-2 cursor-pointer shadow-amber-500/20 disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                    {inputMode === "ocr" ? "Transcribing & Grading..." : "Grading 5 Rubrics..."}
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 text-neutral-950" />
                    {inputMode === "ocr" ? "Transcribe & Grade Sheet" : "Run AES Evaluation"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Column 3: Socratic Evaluation Radar & Feedback Panel */}
          {evaluationResult && (
            <div className={`lg:col-span-4 bg-[#121212] border border-neutral-800 p-5 md:p-6 rounded-3xl space-y-6 shadow-2xl ${
              mobileTab !== "rubric" ? "hidden lg:block" : "block"
            }`}>
              
              {/* Score Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Official UPSC Score
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-black text-white">
                      {evaluationResult.rubrics.total_score}
                    </span>
                    <span className="text-sm font-bold text-neutral-400">
                      / {evaluationResult.rubrics.max_marks} Marks
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Evaluation Engine
                  </span>
                  <div className="text-xs font-bold text-purple-400 flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {evaluationResult.evaluation_mode === "ai_evaluated" ? "Gemini / Groq LLM" : "Heuristic Regularized"}
                  </div>
                </div>
              </div>

              {/* 5-Axis Radar Chart */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
                  5-Axis Pedagogical Radar
                </span>
                <div className="w-full h-52 -my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={evaluationResult.radar_data}>
                      <PolarGrid stroke="#262626" />
                      <PolarAngleAxis dataKey="dimension" stroke="#a3a3a3" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#404040" />
                      <Radar
                        name="Candidate"
                        dataKey="score"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PESTLE Multi-Dimensional Matrix */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                  <span>PESTLE Breadth Check</span>
                  <span className="text-[11px] font-mono text-amber-400">
                    {Object.values(evaluationResult.pestle_breakdown).filter(Boolean).length}/6 Covered
                  </span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(evaluationResult.pestle_breakdown).map(([dimension, covered]) => (
                    <div
                      key={dimension}
                      className={`p-2 rounded-xl text-[11px] font-bold flex items-center gap-2 border ${
                        covered
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-neutral-900/50 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      {covered ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                      )}
                      <span className="truncate">{dimension.split("/")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Canonical Reference Book Citations */}
              <div className="space-y-2.5 border-t border-neutral-800 pt-4">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  Canonical Book Citations
                </span>

                <div className="space-y-2">
                  {evaluationResult.missing_key_citations.map((cite, i) => (
                    <div key={i} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300">{cite.book_title}</span>
                        <span className="text-neutral-400 font-mono">Page {cite.page_number}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 font-serif leading-relaxed">
                        {cite.relevant_concept}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Identified Gaps */}
              <div className="space-y-3 border-t border-neutral-800 pt-4 text-xs">
                <div className="space-y-1.5">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                  </span>
                  <ul className="space-y-1 text-neutral-300">
                    {evaluationResult.strengths.map((s, i) => (
                      <li key={i} className="leading-relaxed list-disc list-inside">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Identified Gaps
                  </span>
                  <ul className="space-y-1 text-neutral-300">
                    {evaluationResult.identified_gaps.map((g, i) => (
                      <li key={i} className="leading-relaxed list-disc list-inside">
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Examiner Verdict */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs text-neutral-300 italic font-serif leading-relaxed">
                &ldquo;{evaluationResult.overall_verdict}&rdquo;
              </div>

            </div>
          )}

        </div>
        </div>
        )}

        {/* TAB 2: MULTI-AGENT SOCRATIC BOARDROOM ORAL VIVA DEFENSE */}
        {mainsStudioTab === "boardroom" && (
          <section className="space-y-3">
            <SocraticBoardroom />
          </section>
        )}

      </main>
      <AppFooter />
    </div>
  );
}
