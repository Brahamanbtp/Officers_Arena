"use client";

import React, { useEffect, useState } from "react";

interface MasteryMapProps {
  userId?: string;
}

export const MasteryMap: React.FC<MasteryMapProps> = ({ userId = "student_999" }) => {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMastery = async () => {
      try {
        const res = await fetch(`/api/v1/arena/mastery-map?user_id=${userId}`);
        if (res.ok) {
          const body = await res.json();
          setData(body.mastery_map);
        }
      } catch (e) {
        console.error("Failed to load BKT mastery map:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMastery();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-neutral-400">
        Recalibrating cognitive Twin...
      </div>
    );
  }

  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <div className="text-neutral-500">No mastery data available.</div>;
  }

  // Radar layout parameters
  const size = 300;
  const center = size / 2;
  const radius = size * 0.35;
  const totalAxes = entries.length;

  // Calculate coordinates
  const points = entries.map(([label, val], i) => {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const valueRatio = val / 100.0;
    const x = center + radius * valueRatio * Math.cos(angle);
    const y = center + radius * valueRatio * Math.sin(angle);
    return { x, y, label, val, angle };
  });

  const polygonPath = points.map(p => `${p.x},${p.y}`).join(" ");

  // Grid concentric rings (e.g. 25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl">
      <h3 className="text-lg font-semibold text-neutral-100 tracking-wider mb-2">
        Cognitive Twin Mastery Map
      </h3>
      <p className="text-xs text-neutral-400 mb-4">
        Bayesian Knowledge Tracing (BKT) Real-time Estimate
      </p>

      <svg width={size} height={size} className="overflow-visible">
        {/* Background Gradients */}
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(212, 163, 89, 0.15)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>

        {/* Glow underlay */}
        <circle cx={center} cy={center} r={radius} fill="url(#radarGlow)" />

        {/* Concentric grid rings */}
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

        {/* Axis Lines */}
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

        {/* Mastery Area Polygon */}
        <polygon
          points={polygonPath}
          fill="rgba(212, 163, 89, 0.25)"
          stroke="rgb(212, 163, 89)"
          strokeWidth="2"
          className="transition-all duration-500 ease-in-out"
        />

        {/* Data points & labels */}
        {points.map((p, i) => {
          // Push labels slightly outwards from the vertices
          const labelDist = radius + 25;
          const labelX = center + labelDist * Math.cos(p.angle);
          const labelY = center + labelDist * Math.sin(p.angle) + 4;
          
          return (
            <g key={i}>
              {/* Vertex Circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="rgb(212, 163, 89)"
                className="transition-all duration-500 ease-in-out"
              />
              {/* Axis Label */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255, 255, 255, 0.75)"
                className="font-mono"
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
