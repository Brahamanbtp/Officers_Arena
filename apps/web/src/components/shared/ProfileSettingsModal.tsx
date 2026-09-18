"use client";

import React, { useState } from "react";
import { 
  User, 
  Target, 
  Settings, 
  Database, 
  Check, 
  Download, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  Zap, 
  Save, 
  X,
  Calendar,
  BookOpen
} from "lucide-react";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useArenaStore } from "@/src/store/useArenaStore";
import { toast } from "sonner";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const clearGuestData = useAuthStore((state) => state.clearGuestData);
  const mode = useArenaStore((state) => state.mode);
  const setMode = useArenaStore((state) => state.setMode);
  const setAuthExamMode = useAuthStore((state) => state.setExamMode);

  const [activeTab, setActiveTab] = useState<"PROFILE" | "GOALS" | "PREFERENCES" | "DATA">("PROFILE");

  // Local form state
  const [fullName, setFullName] = useState(user?.full_name || "Cadet Officer");
  const [targetYear, setTargetYear] = useState(user?.target_year || 2026);
  const [dailyQuestions, setDailyQuestions] = useState(user?.daily_goal_questions || 15);
  const [dailyHours, setDailyHours] = useState(user?.daily_goal_hours || 3);
  const [optionalSubject, setOptionalSubject] = useState(user?.optional_subject || "PSIR (Political Science & IR)");
  const [soundEnabled, setSoundEnabled] = useState(user?.sound_enabled ?? true);

  if (!isOpen) return null;

  const handleSave = () => {
    updateProfile({
      full_name: fullName,
      target_year: targetYear,
      daily_goal_questions: dailyQuestions,
      daily_goal_hours: dailyHours,
      optional_subject: optionalSubject,
      sound_enabled: soundEnabled
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("oa_sound_enabled", soundEnabled ? "true" : "false");
      localStorage.setItem("oa_daily_goal_questions", dailyQuestions.toString());
    }

    toast.success("Profile & Cadet Preferences Saved!", {
      description: "Your daily mission goals and study settings are synchronized."
    });
    onClose();
  };

  const handleExportData = () => {
    const backupData = {
      profile: user,
      exam_mode: mode,
      exported_at: new Date().toISOString(),
      streak: localStorage.getItem("oa_streak_count") || "1",
      mastery_logs: localStorage.getItem("oa_theta_history") || "[]"
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OfficersArena_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Cadet Study Data Exported!", {
      description: "Downloaded complete diagnostic history and study benchmarks."
    });
  };

  const handleResetDiagnostics = () => {
    if (window.confirm("Are you sure you want to reset your diagnostic theta score and local mastery logs?")) {
      clearGuestData();
      if (typeof window !== "undefined") {
        localStorage.removeItem("oa_theta_history");
        localStorage.removeItem("oa_streak_count");
      }
      toast.info("Diagnostic History Reset", {
        description: "Fresh Fisher Information baseline established for new mock runs."
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#111111] border border-neutral-800 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">Cadet Profile & System Settings</h2>
              <p className="text-xs text-neutral-400">Configure target exam goals, daily dosage, and system preferences.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-neutral-800 bg-neutral-950/60 overflow-x-auto scrollbar-none font-mono text-xs">
          <button
            onClick={() => setActiveTab("PROFILE")}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "PROFILE"
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Cadet Profile
          </button>

          <button
            onClick={() => setActiveTab("GOALS")}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "GOALS"
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Exam & Goals
          </button>

          <button
            onClick={() => setActiveTab("PREFERENCES")}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "PREFERENCES"
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Study Preferences
          </button>

          <button
            onClick={() => setActiveTab("DATA")}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "DATA"
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Data & Backup
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          
          {/* PROFILE TAB */}
          {activeTab === "PROFILE" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-xl text-neutral-950 shadow-lg">
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{fullName}</h3>
                  <p className="text-xs text-amber-400 font-mono">
                    {isGuest ? "Guest Cadet Account" : user?.email || "Cadet Officer"}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-neutral-800 text-neutral-300 text-[10px] font-mono rounded">
                    Rank: Probationary Officer
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase font-bold">Officer Name / Call-Sign</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
                  placeholder="Enter your name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-neutral-400 uppercase font-bold">Target Exam Year</label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60 cursor-pointer font-mono"
                  >
                    <option value={2026}>2026 (Active Cycle)</option>
                    <option value={2027}>2027 (Next Cycle)</option>
                    <option value={2028}>2028 (Foundation Cycle)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-neutral-400 uppercase font-bold">Target Stream</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("UPSC");
                        setAuthExamMode("UPSC");
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                        mode === "UPSC"
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      UPSC CSE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("CDS");
                        setAuthExamMode("CDS");
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                        mode === "CDS"
                          ? "bg-blue-500/20 border-blue-500 text-blue-300"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      CDS Defence
                    </button>
                  </div>
                </div>
              </div>

              {mode === "UPSC" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-neutral-400 uppercase font-bold">Optional Subject</label>
                  <select
                    value={optionalSubject}
                    onChange={(e) => setOptionalSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60 cursor-pointer"
                  >
                    <option value="PSIR (Political Science & IR)">PSIR (Political Science & IR)</option>
                    <option value="Sociology">Sociology</option>
                    <option value="Geography">Geography</option>
                    <option value="History">History</option>
                    <option value="Public Administration">Public Administration</option>
                    <option value="Anthropology">Anthropology</option>
                    <option value="Philosophy">Philosophy</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* GOALS TAB */}
          {activeTab === "GOALS" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-300 leading-relaxed font-sans">
                  <strong className="text-white">The 3PL IRT Daily Dosage Principle: </strong>
                  Solving 15 targeted, Fisher-information calibrated questions every day builds higher cutoff probability than solving 100 random unfocused questions.
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-neutral-400 uppercase font-bold">Daily Practice Dosage</label>
                  <span className="text-sm font-black text-amber-400 font-mono">{dailyQuestions} Questions / Day</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={5}
                  value={dailyQuestions}
                  onChange={(e) => setDailyQuestions(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>5 (Light Sprint)</span>
                  <span>15 (Recommended)</span>
                  <span>40 (Intensive Drill)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-neutral-400 uppercase font-bold">Daily Study Target</label>
                  <span className="text-sm font-black text-emerald-400 font-mono">{dailyHours} Hours / Day</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>1 Hr</span>
                  <span>4 Hrs</span>
                  <span>8 Hrs</span>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === "PREFERENCES" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
                    Audio Feedback & Timers
                  </div>
                  <p className="text-xs text-neutral-400">Play subtle audio cues on correct option selection and time alerts.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    soundEnabled ? "bg-amber-500" : "bg-neutral-800"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-neutral-950 transition-transform ${
                    soundEnabled ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">Cognitive Elimination Strikethrough</div>
                  <p className="text-xs text-neutral-400">Allow double-click option elimination to eliminate distractors during test drills.</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold rounded-lg border border-emerald-500/30">
                  Always Active
                </span>
              </div>
            </div>
          )}

          {/* DATA TAB */}
          {activeTab === "DATA" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">Export Cadet Study Records</div>
                  <p className="text-xs text-neutral-400">Download complete diagnostic logs, theta history, and daily scores as JSON.</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export</span>
                </button>
              </div>

              <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-red-400">Reset Local Diagnostic History</div>
                  <p className="text-xs text-neutral-400">Clears your locally stored question performance logs and resets theta to 0.0.</p>
                </div>
                <button
                  onClick={handleResetDiagnostics}
                  className="px-4 py-2 bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

      </div>
    </div>
  );
};
