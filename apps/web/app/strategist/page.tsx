"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppHeader } from "@/src/components/shared/AppHeader";
import { GuestWarningBanner } from "@/src/components/auth/GuestWarningBanner";
import { useArenaStore } from "@/src/store/useArenaStore";
import { 
  Sparkles, 
  Calendar, 
  Target, 
  Brain, 
  BookOpen, 
  RefreshCw, 
  Send
} from "lucide-react";
import { motion } from "framer-motion";

interface StudyDay {
  dayNumber: number;
  dayTitle: string;
  focusArea: string;
  targetReading: string;
  practiceGoal: string;
  status: "pending" | "completed" | "active";
}

const UPSC_7_DAY_PLAN: StudyDay[] = [
  {
    dayNumber: 1,
    dayTitle: "Emergency Provisions & Governor's Discretion",
    focusArea: "Indian Polity (Articles 352-360, 163)",
    targetReading: "M. Laxmikanth - Chapters 14 & 30",
    practiceGoal: "Solve 25 Practice Questions on Executive Powers",
    status: "active"
  },
  {
    dayNumber: 2,
    dayTitle: "Fundamental Rights vs DPSP Harmonization",
    focusArea: "Indian Polity (Articles 12-35, 36-51)",
    targetReading: "NCERT Class XI - Indian Constitution at Work (Ch. 2)",
    practiceGoal: "Review 15 High-Yield PYQs from 2018-2024",
    status: "pending"
  },
  {
    dayNumber: 3,
    dayTitle: "River Systems & Drainage Basins",
    focusArea: "Geography (Himalayan vs Peninsular Rivers)",
    targetReading: "NCERT Class XI - India Physical Environment (Ch. 3)",
    practiceGoal: "Map 12 major rivers and tributaries on OMR",
    status: "pending"
  },
  {
    dayNumber: 4,
    dayTitle: "Constitutional Amendments & Basic Structure",
    focusArea: "Indian Polity (Article 368, Kesavananda Bharati Case)",
    targetReading: "M. Laxmikanth - Chapter 11",
    practiceGoal: "Solve 20 Statement-Based Elimination Questions",
    status: "pending"
  },
  {
    dayNumber: 5,
    dayTitle: "Swadeshi Movement & Partition of Bengal",
    focusArea: "Modern History (1905-1911)",
    targetReading: "Bipin Chandra - History of Modern India (Ch. 7)",
    practiceGoal: "Solve 20 Chronology Match-List Questions",
    status: "pending"
  },
  {
    dayNumber: 6,
    dayTitle: "Constitutional & Statutory Bodies",
    focusArea: "Indian Polity (ECI, UPSC, Finance Commission, NITI Aayog)",
    targetReading: "M. Laxmikanth - Chapters 42-55",
    practiceGoal: "Complete 25-Question Sectional Practice Mock",
    status: "pending"
  },
  {
    dayNumber: 7,
    dayTitle: "Comprehensive 100-Question UPSC Full Mock Simulation",
    focusArea: "UPSC CSE Paper-I Syllabus",
    targetReading: "Full Diagnostic Report & Socratic Review",
    practiceGoal: "Attempt 100-Item Full Mock Test in Arena",
    status: "pending"
  }
];

const CDS_7_DAY_PLAN: StudyDay[] = [
  {
    dayNumber: 1,
    dayTitle: "Incircle, Circumcircle & Triangles Properties",
    focusArea: "Elementary Mathematics (Geometry)",
    targetReading: "CDS Elementary Mathematics Vault (Ch. 12)",
    practiceGoal: "Solve 25 Speed Math & Inradius Questions",
    status: "active"
  },
  {
    dayNumber: 2,
    dayTitle: "Trigonometric Identities & Height-Distance",
    focusArea: "Elementary Mathematics (Trigonometry)",
    targetReading: "CDS PYQ Solutions (2019-2024)",
    practiceGoal: "Solve 30 Trigonometry Formula Speed Drills",
    status: "pending"
  },
  {
    dayNumber: 3,
    dayTitle: "National Security & Defense Institutions",
    focusArea: "Defense Studies & Modern Military History",
    targetReading: "CDS Specialized Doctrine Notes (Ch. 4)",
    practiceGoal: "Review 20 High-Yield Defense Framework Items",
    status: "pending"
  },
  {
    dayNumber: 4,
    dayTitle: "Physical Geography & Atmospheric Pressure",
    focusArea: "General Knowledge (Climatology & Winds)",
    targetReading: "NCERT Class XI - Physical Geography (Ch. 8-10)",
    practiceGoal: "Solve 25 Physical Geography Items",
    status: "pending"
  },
  {
    dayNumber: 5,
    dayTitle: "Speed, Distance, Time & Mensuration 3D",
    focusArea: "Elementary Mathematics (Arithmetic & Volume)",
    targetReading: "CDS Quantitative Aptitude Vault",
    practiceGoal: "Solve 30 Problem-Solving Speed Drills",
    status: "pending"
  },
  {
    dayNumber: 6,
    dayTitle: "English Grammar Rules & Error Spotting",
    focusArea: "English (Parts of Speech & Idioms)",
    targetReading: "CDS English High-Yield Rulebook",
    practiceGoal: "Complete 40 Error-Spotting Practice Items",
    status: "pending"
  },
  {
    dayNumber: 7,
    dayTitle: "Comprehensive 100-Question CDS Full Mock Simulation",
    focusArea: "Combined Defence Services Syllabus",
    targetReading: "Full Diagnostic Report & Velocity Analysis",
    practiceGoal: "Attempt 100-Item Full Mock Test in Arena",
    status: "pending"
  }
];

export default function StrategistPage() {
  const mode = useArenaStore((state) => state.mode);
  const masteryPercentage = useArenaStore((state) => state.masteryPercentage);
  const thetaDelta = useArenaStore((state) => state.thetaDelta);

  const [plan, setPlan] = useState<StudyDay[]>(mode === "CDS" ? CDS_7_DAY_PLAN : UPSC_7_DAY_PLAN);
  const [isGenerating, setIsGenerating] = useState(false);
  const [query, setQuery] = useState("");
  
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "advisor"; text: string }>>([
    {
      role: "advisor",
      text: `Greetings, Candidate. Calibrated for ${mode} Track. Based on your current BKT mastery level (${masteryPercentage}%) and IRT Theta (${thetaDelta.toFixed(3)}), I have synthesized a high-yield 7-day tactical roadmap.`
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    setPlan(mode === "CDS" ? CDS_7_DAY_PLAN : UPSC_7_DAY_PLAN);
  }, [mode]);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      const res = await fetch(`${apiEndpoint}/api/v1/intelligence/dashboard-summary?user_id=student_999&exam_type=${mode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.student_gap && data.student_gap.length > 0) {
          const updatedPlan: StudyDay[] = data.student_gap.slice(0, 7).map((gap: any, idx: number) => ({
            dayNumber: idx + 1,
            dayTitle: gap.topic_name || `Priority Focus Topic ${idx + 1}`,
            focusArea: `${mode} Core Concept`,
            targetReading: `Standard Reference (Priority Score: ${gap.priority_score || 0.85})`,
            practiceGoal: `Solve ${15 + idx * 5} Adaptive Questions`,
            status: idx === 0 ? "active" : "pending"
          }));
          setPlan(updatedPlan);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch fresh intelligence roadmap, using local calibrated twin plan:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setQuery("");
    setChatMessages((prev) => [...prev, { role: "user", text: userText }]);

    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${apiEndpoint}/api/v1/tutor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "student_999",
          message: userText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { role: "advisor", text: data.reply || data.response }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { 
            role: "advisor", 
            text: `Strategic Analysis for "${userText}": Prioritize high-yield topics with high exam frequency in ${mode} syllabus. Allocate 60% of daily time to active OMR solving and 40% to textbook revision.` 
          }
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { 
          role: "advisor", 
          text: `Strategic Analysis for "${userText}": Prioritize high-yield topics with high exam frequency in ${mode} syllabus. Allocate 60% of daily time to active OMR solving and 40% to textbook revision.` 
        }
      ]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0b0b0b] text-neutral-100">
      <GuestWarningBanner />
      <AppHeader />

      <main className="flex-grow max-w-6xl w-full mx-auto p-6 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Sparkles className="w-4 h-4" />
              Autonomous Exam Strategist & AI Advisor
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white mt-1">
              7-Day Tactical Study Plan Generator ({mode} Track)
            </h1>
            <p className="text-sm text-neutral-300 mt-1">
              Personalized roadmap derived from real-time BKT weak points and exam frequency trends.
            </p>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="self-start md:self-auto px-5 py-3 bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Synthesizing Plan..." : "Regenerate 7-Day Plan"}
          </button>
        </div>

        {/* 7-Day Roadmap Cards & AI Advisor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Columns: 7-Day Interactive Timeline */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Target Preparation Schedule ({mode} Track)
              </h2>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Mastery Goal: 85%+
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {plan.map((day) => (
                <motion.div
                  key={day.dayNumber}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 bg-[#121212] border rounded-2xl shadow-xl flex items-start justify-between gap-4 transition-all ${
                    day.status === "active"
                      ? "border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30"
                      : "border-neutral-800 hover:border-neutral-750"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl font-mono text-sm font-black flex items-center justify-center flex-shrink-0 ${
                      day.status === "active"
                        ? "bg-amber-500 text-neutral-950"
                        : "bg-neutral-900 text-neutral-300 border border-neutral-800"
                    }`}>
                      Day {day.dayNumber}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white leading-snug">{day.dayTitle}</h3>
                      <p className="text-xs text-amber-400 font-semibold">{day.focusArea}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
                        <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-neutral-500" /> {day.targetReading}</span>
                        <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-neutral-500" /> {day.practiceGoal}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md border flex-shrink-0 ${
                    day.status === "active"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                      : "bg-neutral-900 text-neutral-400 border-neutral-800"
                  }`}>
                    {day.status === "active" ? "In Progress" : "Queued"}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: AI Strategic Advisor Interactive Chat */}
          <div className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4 h-[600px]">
            <div className="flex items-center gap-3 border-b border-neutral-850 pb-4">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-white">Strategic AI Consultant</h3>
                <p className="text-[10px] text-neutral-400 font-mono">BKT + GraphRAG Powered</p>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-600 text-neutral-950 font-semibold self-end ml-6"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-200 mr-4"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-neutral-850">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask Strategic AI Advisor..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                className="p-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded-xl transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </main>

      <footer className="border-t border-neutral-800 py-4 text-center text-xs tracking-widest uppercase font-bold text-neutral-400 bg-neutral-900/60">
        Officers Arena &copy; 2026 | AUTONOMOUS STRATEGIC AI ADVISOR
      </footer>
    </div>
  );
}
