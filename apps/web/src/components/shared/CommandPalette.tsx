"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Flame, 
  PenTool, 
  Globe, 
  BookOpen, 
  Compass, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Command,
  X
} from "lucide-react";
import { useArenaStore } from "@/src/store/useArenaStore";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const mode = useArenaStore((state) => state.mode);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commandItems = [
    {
      id: "daily-mission",
      title: "Today's High-Yield Mission",
      category: "Daily Directives",
      icon: Flame,
      color: "text-amber-400",
      description: "10 curated questions + 1 Mains Answer Challenge",
      action: () => router.push("/arena?autoStart=true&count=10")
    },
    {
      id: "cat-arena",
      title: mode === "UPSC" ? "Prelims CAT Adaptive Arena" : "CDS Adaptive Test Arena",
      category: "Assessment Engines",
      icon: Flame,
      color: "text-amber-500",
      description: "3PL Item Response Theory test engine with real-time ability estimation",
      action: () => router.push("/arena")
    },
    ...(mode === "UPSC" ? [{
      id: "mains-evaluator",
      title: "Mains 15M / 10M Rubric Evaluator (OCR)",
      category: "Assessment Engines",
      icon: PenTool,
      color: "text-blue-400",
      description: "Handwritten photo OCR with 5-rubric anchor calibration",
      action: () => router.push("/mains")
    }] : []),
    {
      id: "current-affairs",
      title: "360° Current Affairs Hub & GS Bridge",
      category: "Intelligence",
      icon: Globe,
      color: "text-emerald-400",
      description: "Breaking news with GS 1-4 linkages, fact boxes, and textbook tags",
      action: () => router.push("/current-affairs")
    },
    {
      id: "textbook-laxmikanth",
      title: "M. Laxmikanth — Indian Polity Drills",
      category: "Standard Textbooks",
      icon: BookOpen,
      color: "text-amber-400",
      description: "Preamble, Fundamental Rights, Directive Principles, Judiciary",
      action: () => router.push("/library")
    },
    {
      id: "textbook-spectrum",
      title: "Spectrum — Modern Indian History",
      category: "Standard Textbooks",
      icon: BookOpen,
      color: "text-amber-400",
      description: "1857 Revolt, Freedom Struggle Chronology, Acts & Reforms",
      action: () => router.push("/library")
    },
    {
      id: "textbook-shankar",
      title: "Shankar IAS — Environment & Ecology",
      category: "Standard Textbooks",
      icon: BookOpen,
      color: "text-emerald-400",
      description: "Biodiversity, Protected Areas, Climate Conventions, COP Agreements",
      action: () => router.push("/library")
    },
    {
      id: "strategist",
      title: "Cognitive Strategist & Option Tracing",
      category: "Cadet Analytics",
      icon: Compass,
      color: "text-purple-400",
      description: "Detect subconscious traps: absolute qualifiers, hesitation, guessing bias",
      action: () => router.push("/strategist")
    },
    {
      id: "growth",
      title: "Growth, Trajectory & Theta Curve",
      category: "Cadet Analytics",
      icon: TrendingUp,
      color: "text-emerald-400",
      description: "Psychometric ability (θ), BKT syllabus mastery matrix, SEM bounds",
      action: () => router.push("/growth")
    },
    {
      id: "research",
      title: "Psychometric Research & IRT Methodology",
      category: "Methodology",
      icon: ShieldCheck,
      color: "text-amber-400",
      description: "3PL mathematical formulation, Fisher Information curves, scoring audits",
      action: () => router.push("/research")
    }
  ];

  const filteredItems = commandItems.filter((item) => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open triggered by parent if wired
        }
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#121212] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-800 gap-3">
          <Search className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, textbook, subject or jump to a module..."
            className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-neutral-500 font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-neutral-500 hover:text-neutral-300 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 space-y-2">
              <Sparkles className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-xs">No matching commands or textbooks found for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-amber-500/15 border border-amber-500/40 text-white" 
                      : "hover:bg-neutral-900 border border-transparent text-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-neutral-900 border border-neutral-800 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] font-mono text-neutral-500 font-normal">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 line-clamp-1">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 text-neutral-500 ${isSelected ? "text-amber-400 translate-x-0.5" : ""} transition-transform`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-neutral-950 border-t border-neutral-850 flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800 rounded">↵</kbd> Select</span>
          </div>
          <span className="text-amber-500/80 font-bold">Officers Arena Command Hub</span>
        </div>
      </div>
    </div>
  );
};
