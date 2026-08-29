"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sliders, 
  X, 
  Zap, 
  Clock, 
  Play, 
  CheckCircle2,
  Shield,
  BookOpen,
  Calendar,
  Brain,
  Award,
  Sparkles
} from "lucide-react";
import { useArenaStore, TestMode } from "../../store/useArenaStore";
import { generateQuestionBank } from "../../utils/mockQuestionBank";
import { MasteryMap } from "./MasteryMap";

interface TestConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ConfiguratorTrack = "adaptive" | "yearwise";

export const TestConfiguratorModal: React.FC<TestConfiguratorModalProps> = ({ isOpen, onClose }) => {
  const mode = useArenaStore((state) => state.mode);
  const testMode = useArenaStore((state) => state.testMode);
  const setTestMode = useArenaStore((state) => state.setTestMode);
  const setMockQuestions = useArenaStore((state) => state.setMockQuestions);
  const setQuestion = useArenaStore((state) => state.setQuestion);

  // 1. Dual-Mode Track: "adaptive" vs "yearwise"
  const [configTrack, setConfigTrack] = useState<ConfiguratorTrack>("adaptive");

  // 2. Adaptive Controls
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [selectedTestMode, setSelectedTestMode] = useState<TestMode>(testMode);

  // 3. Year-Wise PYQ Controls
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedPaper, setSelectedPaper] = useState<string>(
    mode === "UPSC" ? "Paper-I (General Studies)" : "Elementary Mathematics & GK"
  );

  const subjects = mode === "UPSC" 
    ? ["All", "Indian Polity", "Modern History", "Geography", "Economy", "General Science"]
    : ["All", "Elementary Mathematics", "Defense Studies", "Trigonometry", "Geography", "General Science"];

  const counts = [10, 25, 50, 100];

  const availableYears = [2024, 2023, 2022, 2021, 2020];

  const handleLaunchTest = () => {
    if (configTrack === "yearwise") {
      // Force Full Mock mode for Year-Wise PYQ test
      setTestMode("mock");
      const pyqQuestions = generateQuestionBank(mode, "All", 100, selectedYear, selectedPaper);
      setMockQuestions(pyqQuestions);
    } else {
      setTestMode(selectedTestMode);
      const adaptiveQuestions = generateQuestionBank(mode, selectedSubject, questionCount);
      if (selectedTestMode === "mock") {
        setMockQuestions(adaptiveQuestions);
      } else {
        setQuestion(adaptiveQuestions[0] || null);
      }
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            {/* Mission Briefing Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111111] border border-neutral-800 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl space-y-6 text-neutral-100 font-sans my-auto max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <Sliders className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-wider text-white">
                      Mission Briefing & Exam Setup
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Active Target Objective: <strong className="text-amber-400 font-mono">{mode} Exam Track</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2.2 Segmented Control Dual-Mode Toggle */}
              <div className="flex bg-[#0a0a0a] p-1.5 rounded-2xl border border-neutral-850">
                <button
                  type="button"
                  onClick={() => setConfigTrack("adaptive")}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    configTrack === "adaptive"
                      ? "bg-amber-600 text-neutral-950 shadow-lg shadow-amber-600/20 font-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  Adaptive Practice (BKT & IRT Engine)
                </button>
                <button
                  type="button"
                  onClick={() => setConfigTrack("yearwise")}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    configTrack === "yearwise"
                      ? "bg-amber-600 text-neutral-950 shadow-lg shadow-amber-600/20 font-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Year-Wise PYQ Mock (2020-2024)
                </button>
              </div>

              {/* Main Content Grid: Left Column (BKT Radar Diagnostic Briefing) & Right Column (Config Controls) */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                
                {/* 2.1 Left Column (2 Cols): Embedded BKT Mastery Diagnostic Map */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Cognitive Diagnostic Briefing
                  </div>

                  <MasteryMap userId="student_999" />

                  <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-2">
                    <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      Tactical Nudge
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Review your BKT radar vertices above before launching. Selecting subjects where your cognitive estimate is lowest accelerates your overall IRT theta growth.
                    </p>
                  </div>
                </div>

                {/* Right Column (3 Cols): Dynamic Configuration Controls */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Active Exam Track Indicator */}
                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {mode === "UPSC" ? (
                        <BookOpen className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Shield className="w-5 h-5 text-blue-500" />
                      )}
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-white">
                          Target: {mode === "UPSC" ? "UPSC CSE Prelims (Paper-I)" : "CDS Combined Defence Services"}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          To switch target exam, use the Top Command Bar target dropdown.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONDITIONAL LOGIC BASED ON DUAL-MODE TRACK */}
                  {configTrack === "adaptive" ? (
                    /* 1. ADAPTIVE PRACTICE CONTROLS */
                    <div className="space-y-5">
                      {/* Subject Focus Pills */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400 block">
                          1. Syllabus & Subject Focus
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {subjects.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSelectedSubject(s)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                selectedSubject === s
                                  ? "bg-amber-500 text-neutral-950 border-amber-400 font-black"
                                  : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Question Volume Grid */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400 block">
                          2. Simulation Intensity (Question Volume)
                        </label>
                        <div className="grid grid-cols-4 gap-2.5">
                          {counts.map((c) => {
                            const isSelected = questionCount === c;
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setQuestionCount(c)}
                                className={`py-3 rounded-xl border text-center font-mono text-xs font-black transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10"
                                    : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white"
                                }`}
                              >
                                {c} Qs
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Evaluation Engine Mode */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400 block">
                          3. Evaluation Mode
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedTestMode("practice")}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                              selectedTestMode === "practice"
                                ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-300"
                                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-white">
                                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Instant Socratic
                              </span>
                              {selectedTestMode === "practice" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-tight">
                              Instant GraphRAG hints after each response.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedTestMode("mock")}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                              selectedTestMode === "mock"
                                ? "bg-purple-500/10 border-purple-500/60 text-purple-300"
                                : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-white">
                                <Clock className="w-3.5 h-3.5 text-purple-400" /> Timed OMR
                              </span>
                              {selectedTestMode === "mock" && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-tight">
                              OMR Grid, strict timer, end diagnostic report.
                            </p>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 2. YEAR-WISE PYQ MOCK CONTROLS */
                    <div className="space-y-5">
                      {/* Year Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400 block">
                          1. Select Examination Year
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {availableYears.map((yr) => (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => setSelectedYear(yr)}
                              className={`py-3 rounded-xl border text-center font-mono text-xs font-black transition-all cursor-pointer ${
                                selectedYear === yr
                                  ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-lg shadow-amber-500/20"
                                  : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                              }`}
                            >
                              {yr}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Official Paper Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400 block">
                          2. Select Official Paper
                        </label>
                        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {mode === "UPSC" ? `UPSC CSE ${selectedYear} General Studies (Paper-I)` : `CDS ${selectedYear} Mathematics & General Knowledge`}
                            </span>
                            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md text-[10px] font-mono font-bold">
                              100 Items
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">
                            Official exam structure calibrated with 120-minute countdown timer, OMR response matrix, and standard negative marking calculus ({mode === "UPSC" ? "+2.0 / -0.66" : "+0.83 / -0.27"}).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Launch Action CTA */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleLaunchTest}
                      className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                      style={{ boxShadow: "0 0 25px rgba(217, 119, 6, 0.3)" }}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      {configTrack === "yearwise"
                        ? `Launch ${selectedYear} ${mode} Official Paper Simulation`
                        : `Launch ${questionCount}-Question ${selectedSubject} Test`
                      }
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TestConfiguratorModal;
