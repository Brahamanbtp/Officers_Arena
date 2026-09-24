"use client";

import React, { useEffect, useState } from "react";
import { useArenaStore } from "../../store/useArenaStore";

interface MasteryMapProps {
  userId?: string;
  onStartDiagnostic?: () => void;
}

export const MasteryMap: React.FC<MasteryMapProps> = ({ userId, onStartDiagnostic }) => {
  const mode = useArenaStore((state) => state.mode);
  const resolvedUserId = userId || (typeof window !== "undefined" && (localStorage.getItem("oa_user_id") || localStorage.getItem("oa_guest_id"))) || "guest_student";
  const [data, setData] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAttempts, setHasAttempts] = useState(false);

  useEffect(() => {
    const fetchMastery = async () => {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      try {
        const res = await fetch(`${apiEndpoint}/api/v1/arena/mastery-map?user_id=${resolvedUserId}`);
        if (res.ok) {
          const body = await res.json();
          if (body.mastery_map && Object.keys(body.mastery_map).length > 0) {
            const raw = body.mastery_map;
            const values = Object.values(raw) as number[];
            const nonZero = values.some(v => v > 0);
            
            if (nonZero) {
              setHasAttempts(true);
              if (mode === "CDS") {
                setData({
                  "English": raw["English"] ?? raw["CDS English"] ?? 0,
                  "General Knowledge": Math.round(
                    ((raw["Defense Studies"] ?? 0) +
                     (raw["Geography"] ?? 0) +
                     (raw["General Science"] ?? raw["Science"] ?? 0) +
                     (raw["Indian Polity"] ?? raw["Polity"] ?? 0) +
                     (raw["Modern History"] ?? raw["History"] ?? 0)) / 5
                  ),
                  "Mathematics": Math.round(
                    ((raw["Elementary Mathematics"] ?? raw["Mathematics"] ?? 0) +
                     (raw["Trigonometry"] ?? 0)) / 2
                  )
                });
              } else {
                setData({
                  "Polity": raw["Indian Polity & Governance"] ?? raw["Indian Polity"] ?? raw["Polity"] ?? 0,
                  "History": raw["Modern History"] ?? raw["Ancient History"] ?? raw["History"] ?? 0,
                  "Geography": raw["Geography"] ?? raw["Physical Geography"] ?? 0,
                  "Economy": raw["Economy"] ?? raw["Indian Economy"] ?? 0,
                  "Science": raw["Science"] ?? raw["General Science"] ?? 0
                });
              }
              setLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Error fetching live BKT mastery map:", e);
      }
      
      setHasAttempts(false);
      setData(null);
      setLoading(false);
    };
    fetchMastery();
  }, [userId, mode, resolvedUserId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-xs text-neutral-400 gap-2">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        Recalibrating Cognitive Twin (BKT Engine)...
      </div>
    );
  }

  if (!hasAttempts || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#121212] border border-neutral-800 rounded-2xl shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl font-mono">
          0%
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase text-white tracking-wider">
            Diagnostic Baseline Pending
          </h3>
          <p className="text-[11px] text-neutral-400 max-w-xs leading-relaxed">
            No mock attempts recorded yet for {mode}. Take a 10-question sprint to map your live syllabus mastery.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onStartDiagnostic) {
              onStartDiagnostic();
            } else if (typeof window !== "undefined") {
              window.location.href = "/arena?autoStart=true&count=10&mode=practice";
            }
          }}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
        >
          Launch 10-Q Diagnostic
        </button>
      </div>
    );
  }

  const entries = Object.entries(data);

  // Radar layout parameters
  const size = 280;
  const center = size / 2;
  const radius = size * 0.33;
  const totalAxes = entries.length;

  // Calculate coordinates
  const points = entries.map(([label, val], i) => {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const valueRatio = Math.max(0.1, Math.min(1.0, val / 100.0));
    const x = center + radius * valueRatio * Math.cos(angle);
    const y = center + radius * valueRatio * Math.sin(angle);
    return { x, y, label, val, angle };
  });

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(" ");
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-[#121212] border border-neutral-800 rounded-2xl shadow-xl">
      <div className="w-full flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
        <div>
          <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
            Cognitive Twin Mastery Radar
          </h3>
          <p className="text-[10px] text-neutral-400 font-mono">
            BKT Engine • Dynamic Probability $P(L_t)$
          </p>
        </div>
        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold rounded-lg">
          Live BKT
        </span>
      </div>

      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(217, 119, 6, 0.25)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>

        <circle cx={center} cy={center} r={radius} fill="url(#radarGlow)" />

        {rings.map((r, idx) => (
          <circle
            key={idx}
            cx={center}
            cy={center}
            r={radius * r}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray={idx === 3 ? "none" : "2,2"}
          />
        ))}

        {points.map((p, i) => {
          const targetX = center + radius * Math.cos(p.angle);
          const targetY = center + radius * Math.sin(p.angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={targetX}
              y2={targetY}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={polygonPath}
          fill="rgba(217, 119, 6, 0.25)"
          stroke="rgb(217, 119, 6)"
          strokeWidth="2"
          className="transition-all duration-500 ease-in-out"
        />

        {points.map((p, i) => {
          const labelDist = radius + 24;
          const labelX = center + labelDist * Math.cos(p.angle);
          const labelY = center + labelDist * Math.sin(p.angle) + 3;

          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="rgb(217, 119, 6)"
                className="transition-all duration-500 ease-in-out"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(255, 255, 255, 0.85)"
                className="font-mono font-bold"
              >
                {p.label} ({Math.round(p.val)}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
