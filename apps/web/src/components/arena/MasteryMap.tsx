"use client";

import React, { useEffect, useState } from "react";

interface MasteryMapProps {
  userId?: string;
}

const DEFAULT_MASTERY: Record<string, number> = {
  "Indian Polity": 68.5,
  "Modern History": 55.0,
  "Geography": 72.0,
  "General Science": 60.0,
  "Defense Studies": 75.0
};

export const MasteryMap: React.FC<MasteryMapProps> = ({ userId = "student_999" }) => {
  const [data, setData] = useState<Record<string, number>>(DEFAULT_MASTERY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMastery = async () => {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      try {
        const res = await fetch(`${apiEndpoint}/api/v1/arena/mastery-map?user_id=${userId}`);
        if (res.ok) {
          const body = await res.json();
          if (body.mastery_map && Object.keys(body.mastery_map).length > 0) {
            setData(body.mastery_map);
          }
        }
      } catch (e) {
        console.warn("Using baseline BKT mastery map fallback:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMastery();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-xs text-neutral-400 gap-2">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        Recalibrating Cognitive Twin (BKT Engine)...
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
