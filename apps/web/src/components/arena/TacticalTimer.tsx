"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, AlertTriangle, Clock } from "lucide-react";
import { useArenaStore } from "../../store/useArenaStore";

export const TacticalTimer: React.FC = () => {
  const testMode = useArenaStore((state) => state.testMode);
  const timer = useArenaStore((state) => state.timer);
  const mockTimerLeft = useArenaStore((state) => state.mockTimerLeft);
  const averageTopicTime = useArenaStore((state) => state.averageTopicTime);
  const tickTimer = useArenaStore((state) => state.tickTimer);
  const tickMockTimerLeft = useArenaStore((state) => state.tickMockTimerLeft);
  const isTransitioning = useArenaStore((state) => state.isTransitioning);
  const isMockSubmitted = useArenaStore((state) => state.isMockSubmitted);
  const submitMockTest = useArenaStore((state) => state.submitMockTest);

  const isMock = testMode === "mock";

  // Practice Mode per-question timer tick
  useEffect(() => {
    if (isMock || isTransitioning) return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [tickTimer, isTransitioning, isMock]);

  // Full Mock Mode global countdown timer tick
  useEffect(() => {
    if (!isMock || isMockSubmitted) return;

    const interval = setInterval(() => {
      tickMockTimerLeft();
    }, 1000);

    return () => clearInterval(interval);
  }, [isMock, isMockSubmitted, tickMockTimerLeft]);

  // Auto-submission logic for Full Mock mode when countdown reaches 0
  useEffect(() => {
    if (isMock && !isMockSubmitted && mockTimerLeft <= 0) {
      submitMockTest();
    }
  }, [isMock, isMockSubmitted, mockTimerLeft, submitMockTest]);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const isOverTime = !isMock && timer > averageTopicTime;
  const isLowMockTime = isMock && mockTimerLeft < 300; // < 5 mins left

  return (
    <div className="flex items-center gap-3">
      {/* Visual pulse indicator when time exceeds threshold or low mock time */}
      <motion.div
        animate={
          isOverTime || isLowMockTime
            ? { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }
            : { scale: 1, opacity: 1 }
        }
        transition={
          isOverTime || isLowMockTime
            ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
            : {}
        }
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold font-mono tracking-wider transition-colors duration-300
          ${isOverTime || isLowMockTime 
            ? "bg-rose-500/10 border-rose-500/40 text-rose-400" 
            : "bg-neutral-900 border-neutral-800 text-neutral-300"
          }
        `}
      >
        {isOverTime || isLowMockTime ? (
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-amber-500" />
        )}
        <span>{isMock ? formatTime(mockTimerLeft) : formatTime(timer)}</span>
      </motion.div>

      {isMock && (
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest hidden md:inline">
          Mock Global Timer
        </span>
      )}

      {isOverTime && (
        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hidden md:inline animate-pulse">
          Time Threshold Exceeded
        </span>
      )}
    </div>
  );
};
export default TacticalTimer;
