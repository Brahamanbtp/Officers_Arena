"use client";

import React, { useState, useEffect } from "react";
import { AppHeader } from "@/src/components/shared/AppHeader";
import { GuestWarningBanner } from "@/src/components/auth/GuestWarningBanner";
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
  Layers
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
            setQuestions(data);
            setSelectedQuestion(data[0]);
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

      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        {/* Header Hero Banner */}
        <div className="bg-[#101010] border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-amber-400" />
                UPSC Mains Automated Essay & Answer Scoring Engine (AES)
              </span>
              <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold rounded-lg">
                Multi-Criteria Rubrics • PESTLE • Book Citations
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Descriptive Answer Writing & Socratic Examiner Evaluation
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 max-w-3xl leading-relaxed">
              Practice official UPSC Mains questions (2013–2026). Receive instantaneous multi-dimensional rubric scoring, PESTLE analysis, missing constitutional case law citations, and page-grounded textbook excerpts from M. Laxmikanth, Spectrum, and D.D. Basu.
            </p>
          </div>
        </div>

        {/* Paper & Subject Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121212] border border-neutral-800 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {["ALL", "GS1", "GS2", "GS3", "GS4", "Essay"].map((paper) => (
              <button
                key={paper}
                onClick={() => setSelectedPaper(paper)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPaper === paper
                    ? "bg-amber-600 text-neutral-950 font-black shadow-md"
                    : "bg-neutral-900 text-neutral-400 hover:text-white"
                }`}
              >
                {paper === "ALL" ? "All Papers" : paper}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-neutral-400">
            Showing {filteredQuestions.length} Questions
          </div>
        </div>

        {/* 3-Column Split Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Question Selector (4 Cols) */}
          <div className="lg:col-span-4 bg-[#121212] border border-neutral-800 p-5 rounded-3xl space-y-4 shadow-xl max-h-[800px] overflow-y-auto">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center justify-between border-b border-neutral-800 pb-3">
              <span>Select Mains Question</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </h3>

            <div className="space-y-3">
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
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
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
                        {q.max_marks} Marks • {q.word_limit} Words
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

          {/* Column 2: Answer Writing Canvas (8 Cols or 5 if Evaluated) */}
          <div className={`${evaluationResult ? "lg:col-span-4" : "lg:col-span-8"} bg-[#121212] border border-neutral-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl`}>
            {/* Active Question Prompt */}
            <div className="space-y-3 border-b border-neutral-800 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold rounded-lg font-mono">
                  {selectedQuestion.subject} • {selectedQuestion.year}
                </span>
                <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-mono font-bold">
                  Target: {selectedQuestion.word_limit} Words ({selectedQuestion.max_marks} Marks)
                </span>
              </div>

              <h2 className="text-sm md:text-base font-bold text-white leading-relaxed font-serif">
                {selectedQuestion.text}
              </h2>

              <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-xs text-neutral-300 flex items-start gap-2">
                <span className="text-amber-400 font-black">Directive Focus:</span>
                <span className="text-neutral-300">{selectedQuestion.directive}</span>
              </div>
            </div>

            {/* Answer Input Canvas */}
            <div className="space-y-3">
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
                placeholder="Write your structured answer here (Introduction -> Body Dimensions -> Committee/Case Citations -> Constructive Way Forward)..."
                rows={14}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-all font-serif leading-relaxed"
              />
            </div>

            {/* Submit Evaluation Action */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStudentAnswer("");
                  setEvaluationResult(null);
                  setTimerSeconds(0);
                  setIsTimerRunning(false);
                }}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Clear Answer
              </button>

              <button
                type="button"
                disabled={isEvaluating || wordCount < 20}
                onClick={handleEvaluateAnswer}
                className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-xl flex items-center gap-2 cursor-pointer shadow-amber-500/20 disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Evaluating with AI Examiner...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Evaluate with AI Senior Examiner
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Column 3: Multi-Criteria AI Examiner Report (4 Cols when Evaluated) */}
          {evaluationResult && (
            <div className="lg:col-span-4 bg-[#121212] border border-amber-500/40 p-6 rounded-3xl space-y-6 shadow-2xl">
              {/* Score Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Evaluation Verdict
                  </span>
                  <div className="text-2xl font-black text-white flex items-baseline gap-1">
                    <span>{evaluationResult.rubrics.total_score}</span>
                    <span className="text-sm text-neutral-400 font-normal">/ {evaluationResult.rubrics.max_marks} Marks</span>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">Efficiency</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {evaluationResult.time_taken_seconds ? formatTimer(evaluationResult.time_taken_seconds) : "7m 30s"}
                  </span>
                </div>
              </div>

              {/* 5-Axis Radar Rubric */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <RadarChart className="w-3.5 h-3.5 text-amber-400" />
                  Pedagogical Rubric Radar
                </h4>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={evaluationResult.radar_data}>
                      <PolarGrid stroke="#333" />
                      <PolarAngleAxis dataKey="dimension" stroke="#888" fontSize={9} />
                      <PolarRadiusAxis domain={[0, 100]} stroke="#444" fontSize={8} />
                      <Radar name="Score" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PESTLE Multi-Dimensional Check */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  PESTLE Multi-Dimensional Scope
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(evaluationResult.pestle_breakdown).map(([dim, present]) => (
                    <div
                      key={dim}
                      className={`p-2 rounded-lg border text-[10px] font-bold flex items-center justify-between ${
                        present
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500"
                      }`}
                    >
                      <span className="truncate">{dim}</span>
                      {present ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-3 h-3 text-neutral-600 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Missing Gaps */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-black uppercase tracking-wider text-emerald-400 text-[10px] block mb-1">
                    Key Strengths
                  </span>
                  <ul className="space-y-1 text-neutral-300">
                    {evaluationResult.strengths.map((s: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-black uppercase tracking-wider text-red-400 text-[10px] block mb-1">
                    Identified Gaps & Traps
                  </span>
                  <ul className="space-y-1 text-neutral-300">
                    {evaluationResult.identified_gaps.map((g: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Key Citations from 38 Reference Books */}
              {evaluationResult.missing_key_citations && evaluationResult.missing_key_citations.length > 0 && (
                <div className="space-y-2 border-t border-neutral-800 pt-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Recommended Citations from Canonical Books
                  </span>
                  <div className="space-y-2">
                    {evaluationResult.missing_key_citations.map((cite: any, idx: number) => (
                      <div key={idx} className="p-3 bg-neutral-950 border border-indigo-500/20 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
                          <span>{cite.book_title}</span>
                          <span className="text-[10px] font-mono text-neutral-400">Page {cite.page_number}</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 font-serif leading-relaxed">
                          {cite.relevant_concept}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
