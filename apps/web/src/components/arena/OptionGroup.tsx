"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useArenaStore } from "../../store/useArenaStore";

interface OptionGroupProps {
  options: Record<string, string>; // e.g. {"A": "Option text...", "B": "..."}
  onSelect: (optionId: string) => void;
}

export const OptionGroup: React.FC<OptionGroupProps> = ({ options, onSelect }) => {
  const selectedOption = useArenaStore((state) => state.selectedOption);
  const isTransitioning = useArenaStore((state) => state.isTransitioning);
  const mode = useArenaStore((state) => state.mode);

  // Listen to keyboard keybinds A, B, C, D
  useEffect(() => {
    if (isTransitioning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (["A", "B", "C", "D"].includes(key) && options[key]) {
        // Prevent action if focus is in input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        
        onSelect(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, onSelect, isTransitioning]);

  const optionKeys = Object.keys(options).sort();

  return (
    <div 
      role="radiogroup" 
      aria-label="Question Options"
      className="flex flex-col gap-3 w-full option-group-container"
    >
      {optionKeys.map((key) => {
        const isSelected = selectedOption === key;
        const text = options[key];

        // Mode specific selections styling
        const upscSelectedClass = "bg-slate-100 dark:bg-slate-900 border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-600/30";
        const cdsSelectedClass = "bg-stone-100 dark:bg-stone-900 border-amber-600 dark:border-amber-500 ring-2 ring-amber-600/30";
        
        const upscHoverClass = "hover:border-neutral-400 dark:hover:border-neutral-600";
        const cdsHoverClass = "hover:border-neutral-400 dark:hover:border-neutral-600";

        const selectedStyleClass = mode === "UPSC" ? upscSelectedClass : cdsSelectedClass;
        const hoverStyleClass = mode === "UPSC" ? upscHoverClass : cdsHoverClass;

        return (
          <motion.button
            key={key}
            role="radio"
            aria-checked={isSelected}
            disabled={isTransitioning}
            onClick={() => onSelect(key)}
            whileHover={{ scale: isTransitioning ? 1 : 1.005 }}
            whileTap={{ scale: isTransitioning ? 1 : 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`
              w-full text-left p-4 rounded-xl border flex items-start gap-4 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              ${isSelected ? selectedStyleClass : `bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 ${hoverStyleClass}`}
              ${isTransitioning ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {/* Indicator badge */}
            <span className={`
              w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors duration-200
              ${isSelected 
                ? (mode === "UPSC" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-amber-600 border-amber-600 text-white") 
                : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400"
              }
            `}>
              {key}
            </span>

            {/* Option text content */}
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans pt-0.5">
              {text}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
