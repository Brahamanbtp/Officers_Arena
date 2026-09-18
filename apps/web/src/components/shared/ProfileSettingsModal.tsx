"use client";

import React, { useState } from "react";
import { 
  User, 
  Settings, 
  Target, 
  Flame, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  FileDown, 
  RotateCcw,
  Sparkles
} from "lucide-react";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useArenaStore } from "@/src/store/useArenaStore";
import { ExamMode } from "@/src/types/auth";
import { toast } from "sonner";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const examMode = useAuthStore((state) => state.examMode);
  const setExamMode = useAuthStore((state) => state.setExamMode);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const clearGuestData = useAuthStore((state) => state.clearGuestData);
  const setArenaMode = useArenaStore((state) => state.setMode);

  const [activeTab, setActiveTab] = useState<"profile" | "goals" | "preferences" | "data">("profile");
  const [fullName, setFullName] = useState(user?.full_name || "Cadet Officer");
  const [optionalSubject, setOptionalSubject] = useState(user?.optional_subject || "Polity / PSIR");
  const [dailyQuestions, setDailyQuestions] = useState(user?.daily_goal_questions || 20);
  const [soundEnabled, setSoundEnabled] = useState(user?.sound_enabled ?? true);

  if (!isOpen) return null;

  const handleSave = () => {
    updateProfile({
      full_name: fullName,
      optional_subject: optionalSubject,
      daily_goal_questions: dailyQuestions,
      sound_enabled: soundEnabled
    });
    toast.success("Profile preferences saved successfully!");
    onClose();
  };

  const handleExamChange = (newExam: ExamMode) => {
    setExamMode(newExam);
    setArenaMode(newExam);
    toast.info(`Target Exam switched to ${newExam === "UPSC" ? "UPSC Civil Services" : "CDS Combined Defence Services"}`);
  };

  const handleResetDiagnostics = () => {
    if (confirm("Reset local practice diagnostics and start fresh?")) {
      clearGuestData();
      if (typeof window !== "undefined") {
        localStorage.removeItem("oa_streak_count");
      }
      toast.success("Diagnostics and local session reset complete.");
    }
  };

  const handleExportData = () => {
    const backupData = {
      user,
      examMode,
      streak: typeof window !== "undefined" ? localStorage.getItem("oa_streak_count") : 1,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `officers_arena_profile_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    toast.success("Profile data exported successfully.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#121212] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wide">
                Cadet Settings & Preferences
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                {isGuest ? "Local Guest Session" : user?.email || "Cadet Profile"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-neutral-850 gap-2 bg-neutral-950/50">
          {[
            { id: "profile", label: "Cadet Profile", icon: User },
            { id: "goals", label: "Exam Goals", icon: Target },
            { id: "preferences", label: "Preferences", icon: Sparkles },
            { id: "data", label: "Data & Diagnostics", icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 max-h-[420px] overflow-y-auto">
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Cadet Call-Sign / Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:border-amber-500 outline-none transition-colors"
                  placeholder="Enter your name"
                />
              </div>

              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-mono">Account Mode</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    {isGuest ? "Guest Cadet Mode" : "Authenticated Cadet"}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Your performance metrics and 3PL IRT Ability ($\theta$) are calculated in real time and cached locally. Sign in to sync across devices.
                </p>
              </div>
            </div>
          )}

          {activeTab === "goals" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300">Primary Exam Target</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleExamChange("UPSC")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      examMode === "UPSC"
                        ? "bg-amber-500/15 border-amber-500 text-white font-bold"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <div className="text-xs font-bold text-amber-400">UPSC Civil Services (CSE)</div>
                    <div className="text-[11px] text-neutral-400 mt-1">Prelims GS-1 + CSAT + Mains AES</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExamChange("CDS")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      examMode === "CDS"
                        ? "bg-blue-500/15 border-blue-500 text-white font-bold"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <div className="text-xs font-bold text-blue-400">Combined Defence Services (CDS)</div>
                    <div className="text-[11px] text-neutral-400 mt-1">IMA, INA, AFA & OTA Tracks</div>
                  </button>
                </div>
              </div>

              {examMode === "UPSC" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">Optional Subject Focus</label>
                  <select
                    value={optionalSubject}
                    onChange={(e) => setOptionalSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="Polity / PSIR">Political Science & International Relations (PSIR)</option>
                    <option value="Sociology">Sociology</option>
                    <option value="Geography">Geography</option>
                    <option value="History">History</option>
                    <option value="Public Administration">Public Administration</option>
                    <option value="Philosophy">Philosophy</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-300">Daily Question Practice Goal</span>
                  <span className="font-mono text-amber-400 font-bold">{dailyQuestions} Qs / Day</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={dailyQuestions}
                  onChange={(e) => setDailyQuestions(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl">
                <div>
                  <div className="text-xs font-bold text-white">Audio Feedback & Sound Effects</div>
                  <div className="text-[11px] text-neutral-400">Play subtle tactical clicks on question submission and streak updates</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    soundEnabled
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-neutral-800 border-neutral-700 text-neutral-400"
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-3">
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Export Performance Data</div>
                  <div className="text-[11px] text-neutral-400">Download a JSON snapshot of your ability scores and study history</div>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>

              <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-400">Reset Local Diagnostics</div>
                  <div className="text-[11px] text-neutral-400">Wipe local guest session and reset Ability Theta to zero</div>
                </div>
                <button
                  type="button"
                  onClick={handleResetDiagnostics}
                  className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-850 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
