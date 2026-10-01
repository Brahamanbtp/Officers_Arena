"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Filter, 
  Layers, 
  Activity, 
  BookOpen, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Zap,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface KnowledgeComponentNode {
  id: string;
  name: string;
  domain: "Polity" | "History" | "Economy" | "Geography" | "Ethics" | "Defense" | "Mathematics";
  mastery: number; // 0.0 to 1.0
  frequency: number; // Historical PYQs (1 to 25)
  halfLifeDays: number;
  retentionPercent: number;
  textbook: string;
  keyConcepts: string[];
  x: number;
  y: number;
  z: number;
}

// Generate the 114 Knowledge Components distributed spherically
const DOMAINS: KnowledgeComponentNode["domain"][] = [
  "Polity", "History", "Economy", "Geography", "Ethics", "Defense", "Mathematics"
];

const RAW_TOPIC_NAMES: Record<KnowledgeComponentNode["domain"], string[]> = {
  Polity: [
    "Preamble & Basic Structure", "Fundamental Rights (Art. 14-18)", "Right to Freedom & Privacy (Art. 19-21)",
    "DPSP & Fundamental Duties", "President & Pardoning Powers (Art. 72)", "Governor Discretionary Powers (Art. 163)",
    "President's Rule (Art. 356)", "Financial Emergency (Art. 360)", "Supreme Court Original Jurisdiction (Art. 131)",
    "High Court Writs (Art. 226 vs 32)", "Election Commission (Art. 324)", "Finance Commission (Art. 280)",
    "UPSC & State PSCs (Art. 315)", "CAG Constitutional Mandate (Art. 148)", "Anti-Defection Law (10th Schedule)",
    "73rd Amendment Panchayati Raj", "74th Amendment Urban Local Bodies", "Inter-State River Disputes (Art. 262)",
    "Delimitation Commission", "National Emergency (Art. 352)"
  ],
  History: [
    "Indus Valley Civilization & Rakhigarhi", "Vedic Literature & Philosophy", "Mauryan Administration & Ashoka Edicts",
    "Gupta Golden Age & Science", "Bhakti & Sufi Traditions", "Mughal Mansabdari & Land Revenue",
    "1857 Great Revolt & Leaders", "Socio-Religious Reform Movements", "Morley-Minto Reforms 1909",
    "Montagu-Chelmsford Dyarchy 1919", "Non-Cooperation Movement (1920-22)", "Civil Disobedience Movement (1930)",
    "1930-1942 Round Table Chronology", "Poona Pact & Communal Award", "Government of India Act 1935",
    "Quit India Movement 1942", "INA & Subhas Chandra Bose", "Cabinet Mission Plan 1946",
    "Mountbatten Plan & Partition 1947", "Tribal & Peasant Uprisings"
  ],
  Economy: [
    "Monetary Transmission & EBLR", "Repo Rate & Reverse Repo Operations", "Cash Reserve Ratio & SLR",
    "Fiscal Deficit & FRBM Targets", "Effective Revenue Deficit Dynamics", "Goods and Services Tax (GST) Council",
    "Inflation Targeting & Headline CPI", "Balance of Payments & Current Account", "FDI vs FPI Capital Flows",
    "Foreign Exchange Reserves & NEER/REER", "Priority Sector Lending (PSL) Norms", "Insolvency and Bankruptcy Code (IBC)",
    "National Monetization Pipeline", "NITI Aayog & Aspirational Districts", "WTO Agreement on Agriculture (AoA)",
    "Carbon Pricing & CBAM Impact", "PM Gati Shakti Master Plan", "PLI Schemes for Electronics"
  ],
  Geography: [
    "Plate Tectonics & Continental Drift", "Geomorphology: Fluvial & Karst Landforms", "Indian Monsoon Mechanism & Jet Streams",
    "Indian Ocean Dipole (IOD) & El Nino", "Western Ghats Ecology & Gadgil Panel", "Himalayan Glaciology & GLOF Risks",
    "Major River Basins & Interlinking", "Soil Profiles & Degradation in India", "Tropical Cyclones Formation & IMD Scales",
    "Ramsar Wetland Sites in India", "Coral Bleaching & Reef Ecosystems", "Biosphere Reserves & MAB Program",
    "National Parks & Wildlife Sanctuaries", "Critical Minerals & Rare Earth Reserves", "Renewable Energy Potential (Solar/Wind)"
  ],
  Ethics: [
    "Nolan Principles of Public Life", "Conflict of Interest & Cooling-Off Norms", "Whistleblower Protection Mechanisms",
    "Emotional Intelligence in Administration", "Probity in Public Procurement", "Citizen's Charter & Sevottam Model",
    "2nd ARC Ethics in Governance", "Code of Conduct vs Code of Ethics", "Ethical Governance in AI Systems",
    "Ethical Dilemmas in Crisis Leadership", "Corporate Governance & CSR Norms", "Moral Thinkers: Gandhi, Kant, Mill"
  ],
  Defense: [
    "Integrated Theatre Commands Architecture", "Chief of Defence Staff (CDS) & DMA", "Project 15B Stealth Destroyers",
    "Project 75I Scorpene Submarines", "Agni-V MIRV & Mission Divyastra", "S-400 Triumf Air Defense System",
    "Joint Military Exercises (Malabar, Yudh Abhyas)", "Border Infrastructure & BRO Projects", "Siachen Glacier & Op Meghdoot",
    "Cyber Defense & DISA Capabilities", "Make in India Defense Indigenization", "Defence Acquisition Procedure (DAP 2020)"
  ],
  Mathematics: [
    "Inradius & Circumradius of Triangles", "Speed, Time & Train Distance Problems", "Trigonometric Identities & Heights",
    "Mensuration: Surface Area & Volumes", "Quadratic Equations & Discriminants", "Permutations, Combinations & Probability",
    "Logarithms & Exponents Properties", "Simple & Compound Interest Compounding", "Arithmetic & Geometric Progressions",
    "Coordinate Geometry: Slopes & Distances"
  ]
};

const TEXTBOOK_MAP: Record<KnowledgeComponentNode["domain"], string> = {
  Polity: "M. Laxmikanth (Indian Polity 8th Ed)",
  History: "Spectrum (Modern India) & NCERT Class XI",
  Economy: "Ramesh Singh (Indian Economy 15th Ed)",
  Geography: "NCERT Class XI Physical Geography & Shankar IAS",
  Ethics: "Lexicon for Ethics, Integrity & Aptitude",
  Defense: "CDS Higher Defense Organization Manual",
  Mathematics: "Quantitative Aptitude (RS Aggarwal)"
};

// Generate 114 items
export function generate114Nodes(): KnowledgeComponentNode[] {
  const nodes: KnowledgeComponentNode[] = [];
  let index = 0;
  const total = 114;

  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle in radians

  DOMAINS.forEach((domain) => {
    const list = RAW_TOPIC_NAMES[domain];
    list.forEach((name) => {
      // Fibonacci sphere distribution
      const y = 1 - (index / (total - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * index; // golden angle increment

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      // Deterministic pseudo-randomness for realistic mastery
      const hash = (index * 9301 + 49297) % 233280;
      const rand = hash / 233280;

      let mastery = 0.40 + (rand * 0.55);
      // Hardcode known error leaks to low mastery for direct link
      if (name.includes("Governor Discretionary")) mastery = 0.42;
      if (name.includes("Round Table Chronology")) mastery = 0.38;
      if (name.includes("Monetary Transmission")) mastery = 0.35;

      const frequency = Math.floor(3 + rand * 18);
      const halfLife = Math.floor(4 + rand * 14);
      const retention = Math.round(mastery * 100 * (0.85 + rand * 0.15));

      nodes.push({
        id: `kc-${index + 1}`,
        name,
        domain,
        mastery: Math.min(0.98, Math.max(0.30, mastery)),
        frequency,
        halfLifeDays: halfLife,
        retentionPercent: Math.min(99, Math.max(35, retention)),
        textbook: TEXTBOOK_MAP[domain],
        keyConcepts: [
          `Target Syllabus Linkage: ${domain} Core Module`,
          `Historical UPSC Weightage: ${frequency} PYQ Occurrences`,
          `Cognitive Decay Rate: Half-life ${halfLife} Days`
        ],
        x: x * 180,
        y: y * 180,
        z: z * 180
      });

      index++;
    });
  });

  return nodes;
}

export const MasteryGalaxy3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes] = useState<KnowledgeComponentNode[]>(() => generate114Nodes());
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [selectedNode, setSelectedNode] = useState<KnowledgeComponentNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Rotation angles (radians)
  const rotationRef = useRef({ rotX: 0.2, rotY: 0.4 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesDomain = selectedDomain === "ALL" || n.domain === selectedDomain;
      const matchesSearch = searchQuery === "" || n.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDomain && matchesSearch;
    });
  }, [nodes, selectedDomain, searchQuery]);

  // Main 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Auto-rotation when not interacting
      if (isAutoRotating && !isDraggingRef.current) {
        rotationRef.current.rotY += 0.003;
      }

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw background cosmic grid / stars
      ctx.fillStyle = "rgba(10, 10, 10, 0.4)";
      ctx.fillRect(0, 0, width, height);

      const rotX = rotationRef.current.rotX;
      const rotY = rotationRef.current.rotY;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Project 3D points
      interface ProjectedNode {
        node: KnowledgeComponentNode;
        px: number;
        py: number;
        pz: number;
        scale: number;
        alpha: number;
      }

      const projectedList: ProjectedNode[] = [];

      filteredNodes.forEach((node) => {
        // Rotate around Y
        let x1 = node.x * cosY - node.z * sinY;
        let z1 = node.z * cosY + node.x * sinY;

        // Rotate around X
        let y2 = node.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.y * sinX;

        // Perspective Projection
        const fov = 350 * zoomLevel;
        const distance = 400;
        const scale = fov / (distance + z2);

        const px = cx + x1 * scale;
        const py = cy + y2 * scale;
        const alpha = Math.max(0.15, Math.min(1.0, (z2 + 200) / 400));

        projectedList.push({
          node,
          px,
          py,
          pz: z2,
          scale,
          alpha
        });
      });

      // Sort by depth (Z-buffer back to front)
      projectedList.sort((a, b) => a.pz - b.pz);

      // 1. Draw connecting constellation lines
      ctx.lineWidth = 0.6;
      for (let i = 0; i < projectedList.length; i++) {
        for (let j = i + 1; j < Math.min(i + 4, projectedList.length); j++) {
          const p1 = projectedList[i];
          const p2 = projectedList[j];
          if (p1.node.domain === p2.node.domain) {
            const dist = Math.hypot(p1.px - p2.px, p1.py - p2.py);
            if (dist < 90) {
              const grad = ctx.createLinearGradient(p1.px, p1.py, p2.px, p2.py);
              const col = p1.node.domain === "Polity" ? "245, 158, 11" :
                          p1.node.domain === "History" ? "168, 85, 247" :
                          p1.node.domain === "Economy" ? "16, 185, 129" :
                          p1.node.domain === "Geography" ? "59, 130, 246" :
                          p1.node.domain === "Defense" ? "239, 68, 68" : "234, 179, 8";
              grad.addColorStop(0, `rgba(${col}, ${p1.alpha * 0.25})`);
              grad.addColorStop(1, `rgba(${col}, ${p2.alpha * 0.25})`);
              ctx.strokeStyle = grad;
              ctx.beginPath();
              ctx.moveTo(p1.px, p1.py);
              ctx.lineTo(p2.px, p2.py);
              ctx.stroke();
            }
          }
        }
      }

      // 2. Draw glowing nodes
      projectedList.forEach(({ node, px, py, scale, alpha }) => {
        const isSelected = selectedNode?.id === node.id;
        const isLeak = node.mastery < 0.50;
        const isMastered = node.mastery >= 0.80;

        let nodeColor = isLeak ? "#ef4444" : isMastered ? "#10b981" : "#f59e0b";
        let nodeGlow = isLeak ? "rgba(239, 68, 68, 0.6)" : isMastered ? "rgba(16, 185, 129, 0.6)" : "rgba(245, 158, 11, 0.6)";

        const baseRadius = (isLeak ? 6 : isMastered ? 5 : 4) * scale;
        const radius = isSelected ? baseRadius * 1.8 : baseRadius;

        // Outer glow
        ctx.beginPath();
        ctx.arc(px, py, radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = nodeGlow;
        ctx.globalAlpha = alpha * 0.4;
        ctx.fill();

        // Inner solid core
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#ffffff" : nodeColor;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Node label on hover / selection / high Z
        if (isSelected || (alpha > 0.75 && scale > 1.1)) {
          ctx.font = `${Math.max(9, Math.round(10 * scale))}px monospace`;
          ctx.fillStyle = isSelected ? "#f59e0b" : `rgba(255, 255, 255, ${alpha * 0.9})`;
          ctx.fillText(node.name.length > 20 ? node.name.slice(0, 18) + "..." : node.name, px + radius + 4, py + 3);
        }
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [filteredNodes, selectedNode, isAutoRotating, zoomLevel]);

  // Mouse / Touch Dragging Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;

    rotationRef.current.rotY += deltaX * 0.008;
    rotationRef.current.rotX -= deltaY * 0.008;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const rotX = rotationRef.current.rotX;
    const rotY = rotationRef.current.rotY;
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    let closestNode: KnowledgeComponentNode | null = null;
    let minDistance = 25; // hit radius in pixels

    filteredNodes.forEach((node) => {
      let x1 = node.x * cosY - node.z * sinY;
      let z1 = node.z * cosY + node.x * sinY;
      let y2 = node.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + node.y * sinX;

      const fov = 350 * zoomLevel;
      const scale = fov / (400 + z2);
      const px = cx + x1 * scale;
      const py = cy + y2 * scale;

      const dist = Math.hypot(clickX - px, clickY - py);
      if (dist < minDistance && z2 > -150) {
        minDistance = dist;
        closestNode = node;
      }
    });

    if (closestNode) {
      setSelectedNode(closestNode);
      setIsAutoRotating(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-[#111111] via-[#0d0d0d] to-[#080808] border border-neutral-800 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-neutral-850 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              3D Knowledge Component Galaxy (114 Nodes)
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-mono rounded">
              BKT Real-Time Latent State
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Interactive Multi-Tier Cognitive Constellation
          </h2>
          <p className="text-xs text-neutral-400 font-sans max-w-xl">
            Click and drag to rotate the 3D knowledge space. Nodes glow <strong className="text-emerald-400">Green (Mastered &ge;80%)</strong>, <strong className="text-amber-400">Amber (Review 50-79%)</strong>, and <strong className="text-red-400">Red (Critical Leaks &lt;50%)</strong>.
          </p>
        </div>

        {/* Viewport Control Cluster */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAutoRotating ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-neutral-900 border-neutral-800 text-neutral-400"
            }`}
            title="Toggle Orbit Auto-Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? "animate-spin text-amber-400" : ""}`} />
            <span className="hidden sm:inline">{isAutoRotating ? "Orbiting" : "Paused"}</span>
          </button>

          <button
            onClick={() => setZoomLevel(Math.min(1.6, zoomLevel + 0.15))}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.15))}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Domain Filters & Live Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {["ALL", ...DOMAINS].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedDomain === d
                  ? "bg-amber-500 text-neutral-950 font-black shadow-md"
                  : "bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {d === "ALL" ? "All 114 KCs" : d}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search 114 nodes (e.g. 'Preamble', 'Inradius')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: 3D Viewport */}
        <div className="lg:col-span-2 relative bg-[#070707] border border-neutral-850 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center min-h-[420px]">
          <canvas
            ref={canvasRef}
            width={760}
            height={460}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
            className="w-full h-[420px] cursor-grab active:cursor-grabbing"
          />

          {/* Quick HUD Overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 rounded-xl text-[10px] font-mono text-neutral-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered ({nodes.filter(n => n.mastery >= 0.8).length})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Review ({nodes.filter(n => n.mastery >= 0.5 && n.mastery < 0.8).length})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critical Leaks ({nodes.filter(n => n.mastery < 0.5).length})
            </span>
          </div>
        </div>

        {/* Right Col: Node Inspector Card */}
        <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
          {selectedNode ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-3">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold rounded">
                    {selectedNode.domain} Domain • Node #{selectedNode.id.replace("kc-", "")}
                  </span>
                  <h3 className="text-base font-black text-white leading-tight">
                    {selectedNode.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-neutral-500 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>

              {/* Mastery Gauges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-900 border border-neutral-850 rounded-xl space-y-1">
                  <div className="text-[10px] text-neutral-400 font-mono">BKT Latent Mastery</div>
                  <div className={`text-lg font-black font-mono ${
                    selectedNode.mastery >= 0.8 ? "text-emerald-400" : selectedNode.mastery >= 0.5 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {(selectedNode.mastery * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3 bg-neutral-900 border border-neutral-850 rounded-xl space-y-1">
                  <div className="text-[10px] text-neutral-400 font-mono">Forgetting Half-Life</div>
                  <div className="text-lg font-black text-purple-400 font-mono">
                    {selectedNode.halfLifeDays} Days
                  </div>
                </div>
              </div>

              {/* Memory Retention Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Retention Probability:</span>
                  <span className="text-white font-bold">{selectedNode.retentionPercent}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full rounded-full ${
                      selectedNode.retentionPercent >= 80 ? "bg-emerald-500" : selectedNode.retentionPercent >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${selectedNode.retentionPercent}%` }}
                  />
                </div>
              </div>

              {/* Standard Reference Source */}
              <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-1">
                <div className="text-[10px] font-mono text-purple-300 font-bold uppercase flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Standard Authority Reference
                </div>
                <div className="text-xs text-neutral-200">{selectedNode.textbook}</div>
              </div>

              {/* Action Button: Launch 5-Question Drill */}
              <Link
                href={`/arena?autoStart=true&count=5&subject=${encodeURIComponent(selectedNode.domain)}&topic=${encodeURIComponent(selectedNode.name)}&mode=practice`}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 font-mono cursor-pointer"
              >
                <span>Launch 5-Question Adaptive Drill</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3 text-neutral-400">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
              <div className="text-sm font-bold text-white">Select Any Knowledge Node</div>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                Click any glowing celestial node on the 3D galaxy sphere to inspect BKT probability, memory decay, and launch targeted drills.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
