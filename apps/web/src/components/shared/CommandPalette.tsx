"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Activity, 
  PenTool, 
  Globe, 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  ArrowRight, 
  Target, 
  Layers, 
  X,
  FileText,
  Sliders
} from "lucide-react";
import { useArenaStore } from "@/src/store/useArenaStore";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenHelp
}) => {
  const router = useRouter();
  const mode = useArenaStore((state) => state.mode);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global key listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const commandItems = [
    // Primary Modules
    { label: "Daily Mission Command Center", href: "/", icon: Activity, category: "Navigation", description: "Today's high-yield sprint and daily dosage" },
    { label: mode === "UPSC" ? "UPSC Prelims Testing Arena" : "CDS Defence Testing Arena", href: "/arena", icon: Target, category: "Testing", description: "3PL IRT adaptive mock drill with cognitive tracing" },
    { label: "10-Question High-Yield Sprint", href: "/arena?autoStart=true&count=10&mode=practice", icon: Zap, category: "Quick Action", description: "Instant 10-minute calibrated practice sprint" },
    ...(mode === "UPSC" ? [{ label: "Handwritten Mains AES Evaluator", href: "/mains", icon: PenTool, category: "Mains Answer", description: "Instant 30s OCR grading across 5 calibrated rubrics" }] : []),
    { label: "360° Current Affairs Intelligence Hub", href: "/current-affairs", icon: Globe, category: "Current Affairs", description: "Live wire feeds linked directly to standard textbooks" },
    { label: "Digital Library & AI Tutor", href: "/library", icon: BookOpen, category: "Study Material", description: "NCERT, Laxmikanth, Spectrum, and standard manuals" },
    { label: "Cognitive Strategist & Ability Curve", href: "/strategist", icon: Sparkles, category: "Analytics", description: "IRT ability score (θ) & cutoff margin predictions" },
    { label: "Growth & Accuracy Analytics", href: "/growth", icon: TrendingUp, category: "Analytics", description: "Subject-wise mastery heatmaps & speed pacing" },
    { label: "Research & Exam Trends Portal", href: "/research", icon: Layers, category: "Research", description: "2011-2024 PYQ drift and linguistic complexity" },
    // Standard Textbooks
    { label: "M. Laxmikanth (Indian Polity)", href: "/library?book=laxmikanth", icon: FileText, category: "Textbooks", description: "Fundamental Rights, DPSP, Parliament, Judiciary" },
    { label: "Spectrum Modern India (Rajiv Ahir)", href: "/library?book=spectrum", icon: FileText, category: "Textbooks", description: "Freedom struggle chronology & constitutional acts" },
    { label: "NCERT Ancient & Medieval History", href: "/library?book=ncert_history", icon: FileText, category: "Textbooks", description: "Indus Valley, Vedic, Mauryan, and Gupta epochs" },
    { label: "PMF IAS / Shankar IAS (Environment)", href: "/library?book=environment", icon: FileText, category: "Textbooks", description: "Biodiversity, climate protocols, protected areas" }
  ];

  const filtered = commandItems.filter(item => 
    query === "" || 
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: typeof commandItems[0]) => {
    onClose();
    router.push(item.href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-neutral-800 rounded-3xl max-w-xl w-full flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-neutral-800 flex items-center gap-3 bg-neutral-900/50">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, subject, textbook, or page to jump..."
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-sans"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg bg-neutral-800 border border-neutral-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No matching commands or textbooks found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item)}
                  className="w-full p-3 rounded-2xl border border-transparent hover:border-amber-500/30 hover:bg-neutral-900 text-left flex items-center justify-between gap-3 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 group-hover:bg-amber-500/20 border border-neutral-800 group-hover:border-amber-500/40 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4 text-neutral-400 group-hover:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 text-neutral-400 text-[9px] font-mono rounded uppercase">
                      {item.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/80 flex items-center justify-between text-[11px] font-mono text-neutral-400 px-4">
          <div className="flex items-center gap-3">
            <span><strong>↑↓</strong> Navigate</span>
            <span><strong>↵</strong> Select</span>
            <span><strong>ESC</strong> Close</span>
          </div>
          <span className="text-amber-400 font-bold">Officers Arena v2.6</span>
        </div>

      </div>
    </div>
  );
};
