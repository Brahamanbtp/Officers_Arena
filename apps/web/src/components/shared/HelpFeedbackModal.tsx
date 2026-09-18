"use client";

import React, { useState } from "react";
import { 
  HelpCircle, 
  MessageSquare, 
  Bug, 
  Sparkles, 
  Send, 
  X, 
  CheckCircle2, 
  BookOpen, 
  ShieldCheck, 
  FileEdit,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

interface HelpFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpFeedbackModal: React.FC<HelpFeedbackModalProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const [feedbackType, setFeedbackType] = useState<"question_error" | "feature_request" | "bug" | "academic_query">("question_error");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a description before submitting.");
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      toast.success("Feedback submitted to Officers Arena Academic Team!");
      setSubmitted(false);
      setMessage("");
      onClose();
    }, 800);
  };

  const faqs = [
    {
      q: "How does the 3PL CAT Adaptive Test work?",
      a: "The Item Response Theory engine calculates your real ability level (Theta θ) dynamically. If you answer correctly, difficulty (b) increases to test upper boundaries; if incorrect, it recalibrates to pinpoint precise misconceptions."
    },
    {
      q: "How is Mains AES answer grading calibrated?",
      a: "Our Anchor AES model assesses handwritten answers on 5 weighted UPSC dimensions: Directive Adherence, Structural Flow, Analytical Depth, Factual Substantiation, and Presentation/Schematics."
    },
    {
      q: "How frequently is Current Affairs updated?",
      a: "Every hour, breaking developments from 50+ national and global news wires are ingested, filtered, and linked to static GS 1-4 syllabus chapters."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#121212] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wide">
                Cadet Support & Academic Feedback
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                Active Context: <span className="text-amber-400">{pathname}</span>
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[460px] overflow-y-auto">
          {/* Category Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300">Feedback Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "question_error", label: "Question Error", icon: BookOpen },
                { id: "academic_query", label: "Syllabus Query", icon: ShieldCheck },
                { id: "bug", label: "Platform Bug", icon: Bug },
                { id: "feature_request", label: "Feature Idea", icon: Sparkles }
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = feedbackType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedbackType(cat.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="text-xs font-bold text-neutral-300">Description / Details</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue, question typo, or enhancement you'd like to see..."
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:border-purple-500 outline-none resize-none transition-colors"
            />
            <button
              type="submit"
              disabled={submitted}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitted ? "Submitting..." : "Send Feedback"}</span>
            </button>
          </form>

          {/* FAQ Accordion */}
          <div className="space-y-2 pt-2 border-t border-neutral-850">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-2xl cursor-pointer hover:border-neutral-750 transition-colors"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                    {isOpen && (
                      <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed animate-in fade-in duration-100">
                        {faq.a}
                      </p>
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
