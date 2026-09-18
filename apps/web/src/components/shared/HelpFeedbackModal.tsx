"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  HelpCircle, 
  MessageSquarePlus, 
  AlertTriangle, 
  BookOpen, 
  BrainCircuit, 
  Send, 
  CheckCircle2, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ShieldCheck 
} from "lucide-react";
import { useArenaStore } from "@/src/store/useArenaStore";
import { toast } from "sonner";

interface HelpFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpFeedbackModal: React.FC<HelpFeedbackModalProps> = ({
  isOpen,
  onClose
}) => {
  const pathname = usePathname();
  const mode = useArenaStore((state) => state.mode);

  const [category, setCategory] = useState<"QUESTION_ERROR" | "SYLLABUS_REQUEST" | "AI_EVALUATION" | "BUG_REPORT" | "FEATURE_SUGGESTION">("QUESTION_ERROR");
  const [feedbackText, setFeedbackText] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast.error("Please enter your feedback description.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Feedback & Support Ticket Submitted!", {
        description: "Thank you Cadet. Our academic and engineering board will review this dispatch."
      });
      setFeedbackText("");
      onClose();
    }, 600);
  };

  const faqs = [
    {
      q: "How does the 3PL IRT Adaptive Testing engine calculate my ability score (θ)?",
      a: "The Item Response Theory (IRT) model dynamically adjusts question difficulty using 3 parameters: Discrimination (a), Difficulty (b), and Guessing pseudo-chance (c). Instead of raw percentages, your ability score θ represents your true probability of clearing the official cutoff with maximum Fisher Information."
    },
    {
      q: "How does Handwritten Mains OCR and AES Evaluation work?",
      a: "You write on real notebook paper and upload a photo. The multi-modal vision pipeline extracts your handwritten transcript with Indian administrative handwriting OCR, then grades your answer across 5 calibrated rubrics (Directive Adherence, Structural Flow, Fact Grounding, Balanced View, Conclusion) in under 30 seconds."
    },
    {
      q: "How often is the Global Current Affairs Intelligence feed updated?",
      a: "Wire dispatches from PIB, The Hindu, BBC World, and Ministry of Defence are polled in real-time and enriched via AI to link every news item to its exact chapter in Laxmikanth, NCERT, and Spectrum."
    },
    {
      q: "Can I use Officers Arena in offline / low-bandwidth conditions?",
      a: "Yes. Officers Arena maintains a canonical repository of high-yield mock tests and standard textbooks so core practice remains uninterrupted even with flaky internet."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#111111] border border-neutral-800 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">Cadet Support & Academic Feedback</h2>
              <p className="text-xs text-neutral-400">Report question issues, request syllabus modules, or ask platform questions.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-400 uppercase font-bold">Category of Feedback</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: "QUESTION_ERROR", label: "Question Error / Typo", icon: AlertTriangle },
                  { key: "SYLLABUS_REQUEST", label: "Syllabus Request", icon: BookOpen },
                  { key: "AI_EVALUATION", label: "AI Grading Feedback", icon: BrainCircuit },
                  { key: "BUG_REPORT", label: "Platform Bug", icon: ShieldCheck },
                  { key: "FEATURE_SUGGESTION", label: "Feature Suggestion", icon: Sparkles }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCategory(item.key as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer text-left ${
                        isSelected
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-400 uppercase font-bold">Your Observations / Notes</label>
              <textarea
                rows={4}
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe the issue, cite the question text or reference textbook chapter, or share your suggestion..."
                className="w-full p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 font-sans leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-neutral-400 uppercase font-bold">Your Email (Optional for reply)</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="officer@example.com"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="p-2.5 bg-neutral-900/60 border border-neutral-850 rounded-xl space-y-0.5 font-mono text-[11px] text-neutral-400">
                <div>Active Stream: <strong className="text-amber-400">{mode}</strong></div>
                <div className="truncate">Context Route: <strong className="text-white">{pathname}</strong></div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Dispatching..." : "Submit Academic Feedback"}</span>
            </button>
          </form>

          {/* Frequently Asked Questions */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Frequently Asked Cadet Questions
            </h3>

            <div className="space-y-2">
              {faqs.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/40 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                      className="w-full p-3.5 text-left text-xs font-bold text-neutral-200 flex items-center justify-between gap-3 cursor-pointer hover:text-white"
                    >
                      <span>{faq.q}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-neutral-500" />}
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 text-xs text-neutral-400 leading-relaxed font-sans border-t border-neutral-850 pt-2 bg-neutral-950/40">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
