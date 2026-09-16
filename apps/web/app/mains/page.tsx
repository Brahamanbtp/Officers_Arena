"use client";

import React, { useState, useEffect } from "react";
import { AppHeader } from "@/src/components/shared/AppHeader";
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
  ListFilter
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

interface MainsQuestion {
  id: string;
  text: string;
  year: number;
  subject: string;
  max_marks: number;
  word_limit: number;
  directive: string;
}

const SAMPLE_MAINS_QUESTIONS: MainsQuestion[] = [
  {
    id: "mains-polity-1",
    text: "Critically analyze the role of the Governor in the Indian Constitutional framework, particularly regarding the exercise of discretionary powers under Article 163 and Article 200. Does it undermine the federal balance? (150 words, 10 marks)",
    year: 2024,
    subject: "General Studies Paper - II (Polity & Governance)",
    max_marks: 10,
    word_limit: 150,
    directive: "Critically Analyze (Requires pros, cons, evidence & objective synthesis)"
  },
  {
    id: "mains-economy-1",
    text: "Discuss the structural challenges of External Benchmark Lending Rate (EBLR) in achieving seamless monetary policy transmission in India. Suggest pragmatic reforms. (250 words, 15 marks)",
    year: 2025,
    subject: "General Studies Paper - III (Economy & Development)",
    max_marks: 15,
    word_limit: 250,
    directive: "Discuss (Requires balanced, multi-faceted exploration of all dimensions)"
  },
  {
    id: "mains-history-1",
    text: "The Swadeshi Movement of 1905 marked a radical paradigm shift from moderate constitutional agitation to mass direct action. Elucidate with reference to Boycott and National Education. (150 words, 10 marks)",
    year: 2023,
    subject: "General Studies Paper - I (Modern Indian History)",
    max_marks: 10,
    word_limit: 150,
    directive: "Elucidate (Requires clarifying core concepts with illustrative examples)"
  },
  {
    id: "mains-ethics-1",
    text: "Explain the concept of 'Constitutional Morality' as propounded by Dr. B.R. Ambedkar and its modern judicial application in upholding administrative integrity. (150 words, 10 marks)",
    year: 2024,
    subject: "General Studies Paper - IV (Ethics & Integrity)",
    max_marks: 10,
    word_limit: 150,
    directive: "Examine (Requires detailed factual probe and underlying root causes)"
  }
];

export default function MainsEvaluationPage() {
  const [questions, setQuestions] = useState<MainsQuestion[]>(SAMPLE_MAINS_QUESTIONS);
  const [selectedQuestion, setSelectedQuestion] = useState<MainsQuestion>(SAMPLE_MAINS_QUESTIONS[0]);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [selectedPaper, setSelectedPaper] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Mobile responsive view tabs
  const [mobileTab, setMobileTab] = useState<"questions" | "editor" | "rubric">("editor");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer & Metrics
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

  // Load official questions from backend
  useEffect(() => {
    const fetchQuestions = async () => {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      try {
        const res = await fetch(`${apiEndpoint}/api/v1/mains/questions?limit=25`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Filter out any objective/instruction artifacts
            const cleanQs = data.filter(q => 
              !q.text.toLowerCase().includes("instruction") && 
              !q.text.toLowerCase().includes("answer sheet") &&
              !q.text.toLowerCase().includes("mark the correct code")
            );
            if (cleanQs.length > 0) {
              setQuestions(cleanQs);
              setSelectedQuestion(cleanQs[0]);
            }
          }
        }
      } catch (err) {
        // Fallback to sample questions
      }
    };
    fetchQuestions();
  }, []);

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

  const handleEvaluateAnswer = async () => {
    if (wordCount < 20) {
      toast.error("Answer too short! Write at least 20 words for a meaningful evaluation.");
      return;
    }

    setIsEvaluating(true);
    setIsTimerRunning(false);

    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
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
    } catch (err) {
      toast.error("Could not connect to evaluation server.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedPaper !== "ALL" && !q.subject.toLowerCase().includes(selectedPaper.toLowerCase())) {
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
                5-Axis Radar • PESTLE • Book Citations
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Descriptive Answer Writing & Socratic Evaluation
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 max-w-3xl leading-relaxed">
              Official GS1–GS4 & Essay descriptive practice grounded in canonical textbooks (*M. Laxmikanth, Spectrum, Subhash Kashyap*).
            </p>
          </div>
        </div>

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
          
          {/* Column 1: Question Selection Drawer/List (Visible on desktop or when mobileTab === 'questions') */}
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

            {/* Answer Input Canvas */}
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

            {/* Submit Evaluation Action */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStudentAnswer("");
                  setEvaluationResult(null);
                  setTimerSeconds(0);
                  setIsTimerRunning(false);
                }}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                disabled={isEvaluating || wordCount < 20}
                onClick={handleEvaluateAnswer}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-xl flex items-center gap-2 cursor-pointer shadow-amber-500/20 disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Grading with Rubrics...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Evaluate Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Column 3: Socratic Evaluation Results */}
          {evaluationResult && (
            <div className={`lg:col-span-4 bg-[#121212] border border-neutral-800 p-5 md:p-6 rounded-3xl space-y-5 shadow-2xl ${
              mobileTab !== "rubric" ? "hidden lg:block" : "block"
            }`}>
              
              {/* Score Header */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                    Scaled UPSC Score
                  </span>
                  <div className="text-2xl font-black font-mono text-white mt-0.5">
                    {evaluationResult.rubrics.total_score} <span className="text-sm font-normal text-neutral-400">/ {evaluationResult.rubrics.max_marks}</span>
                  </div>
                </div>
                <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400">
                  <Award className="w-7 h-7" />
                </div>
              </div>

              {/* 5-Axis Radar Chart */}
              <div className="space-y-2 border-b border-neutral-800 pb-4">
                <h4 className="text-xs font-black uppercase text-neutral-300">
                  5-Axis Multi-Criteria Rubrics
                </h4>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={evaluationResult.radar_data}>
                      <PolarGrid stroke="#262626" />
                      <PolarAngleAxis dataKey="dimension" stroke="#a3a3a3" tick={{ fill: "#a3a3a3", fontSize: 9 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#404040" />
                      <Radar name="Candidate Score" dataKey="score" stroke="#d97706" fill="#f59e0b" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PESTLE Multi-Dimensional Analysis */}
              <div className="space-y-2 border-b border-neutral-800 pb-4">
                <h4 className="text-xs font-black uppercase text-neutral-300">
                  PESTLE Multi-Depth Coverage
                </h4>
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px]">
                  {Object.entries(evaluationResult.pestle_breakdown || {}).map(([dim, covered]) => (
                    <div
                      key={dim}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 ${
                        covered
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500"
                      }`}
                    >
                      <span className="font-bold uppercase text-[9px]">{dim}</span>
                      {covered ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-neutral-600" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grounded Citations Callout */}
              {evaluationResult.missing_key_citations && evaluationResult.missing_key_citations.length > 0 && (
                <div className="space-y-2 border-b border-neutral-800 pb-4">
                  <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Missing Key Textbook Citations
                  </h4>
                  <div className="space-y-2">
                    {evaluationResult.missing_key_citations.map((cite: any, i: number) => (
                      <div key={i} className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-neutral-200">{cite.book_title}</span>
                          <span className="text-amber-400 font-mono">Pg. {cite.page_number}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-serif line-clamp-2">
                          {cite.relevant_concept}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examiner Verdict */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Examiner Synthesis
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed font-serif">
                  {evaluationResult.overall_verdict}
                </p>
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}
