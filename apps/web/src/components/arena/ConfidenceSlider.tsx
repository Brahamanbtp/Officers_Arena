"use client";

import React from "react";
import { motion } from "framer-motion";
import { useArenaStore } from "../../store/useArenaStore";

interface ConfidenceSliderProps {
  onChange: (value: number) => void;
}

export const ConfidenceSlider: React.FC<ConfidenceSliderProps> = ({ onChange }) => {
  const confidence = useArenaStore((state) => state.confidence);
  const selectedOption = useArenaStore((state) => state.selectedOption);
  const mode = useArenaStore((state) => state.mode);

  if (!selectedOption) return null;

  const confidenceLevels = [
    { value: 1, label: "Lucky Guess", description: "Wild guess / No idea" },
    { value: 2, label: "Low Confidence", description: "Educated guess" },
    { value: 3, label: "Moderate", description: "50/50 probability" },
    { value: 4, label: "High Confidence", description: "Fairly certain" },
    { value: 5, label: "Absolute Certainty", description: "100% correct" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="p-5 border rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-800"
    >
      <div className="mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Metacognitive Confidence Assessment
        </h4>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          Estimate your level of certainty. This calibrates the adaptive difficulty loop.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {confidenceLevels.map((lvl) => {
          const isSelected = confidence === lvl.value;
          
          const upscActiveClass = "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10";
          const cdsActiveClass = "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-600/10";
          
          const activeClass = mode === "UPSC" ? upscActiveClass : cdsActiveClass;

          return (
            <motion.button
              key={lvl.value}
              type="button"
              onClick={() => onChange(lvl.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-3 rounded-xl border flex flex-col items-center text-center transition-all duration-200 cursor-pointer outline-none
                ${isSelected 
                  ? activeClass 
                  : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-850 hover:border-neutral-350 text-neutral-700 dark:text-neutral-300"
                }
              `}
            >
              <span className="text-lg font-extrabold">{lvl.value}</span>
              <span className="text-[10px] font-bold tracking-wide uppercase mt-1 hidden md:block">
                {lvl.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {confidence && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs font-semibold mt-3 text-neutral-500 dark:text-neutral-400"
        >
          Selected: {confidenceLevels.find((l) => l.value === confidence)?.description}
        </motion.p>
      )}
    </motion.div>
  );
};
