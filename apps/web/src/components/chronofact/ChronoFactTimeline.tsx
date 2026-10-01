"use client";

import React, { useState } from "react";
import { 
  History, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  Landmark, 
  Scale, 
  SlidersHorizontal,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface TimelineMilestone {
  year: number;
  actTitle: string;
  era: string;
  shortSummary: string;
  keyProvisions: string[];
  constitutionalLegacy: string;
  pyqFrequency: number;
  sampleQuestion: string;
  standardReference: string;
}

const MILESTONES: TimelineMilestone[] = [
  {
    year: 1773,
    actTitle: "Regulating Act of 1773",
    era: "Company Rule Genesis",
    shortSummary: "First step taken by the British Parliament to control and regulate the affairs of the East India Company in India.",
    keyProvisions: [
      "Designated Governor of Bengal as 'Governor-General of Bengal' (Lord Warren Hastings).",
      "Subordinated Bombay and Madras Presidencies to Bengal.",
      "Established Supreme Court at Calcutta (1774) with 1 Chief Justice (Sir Elijah Impey) and 3 judges.",
      "Prohibited company servants from engaging in private trade or accepting bribes."
    ],
    constitutionalLegacy: "Genesis of centralized executive administration and supreme judicial jurisdiction in India.",
    pyqFrequency: 8,
    sampleQuestion: "Which Act for the first time made provision for the establishment of a Supreme Court at Calcutta?",
    standardReference: "M. Laxmikanth Chapter 1 & Spectrum Chapter 25"
  },
  {
    year: 1858,
    actTitle: "Government of India Act 1858 (Act for Better Government of India)",
    era: "Direct Crown Rule",
    shortSummary: "Liquidated the East India Company and transferred powers of government, territories, and revenues to the British Crown following the 1857 Revolt.",
    keyProvisions: [
      "Abolished Board of Control and Court of Directors, ending the Double Government system.",
      "Created office of Secretary of State for India (Cabinet member) assisted by a 15-member Council.",
      "Changed designation from Governor-General to Viceroy of India (Lord Canning became first Viceroy)."
    ],
    constitutionalLegacy: "Established direct unitary British imperial sovereignty over Indian territory.",
    pyqFrequency: 11,
    sampleQuestion: "By which Act was the office of Secretary of State for India created with a 15-member advisory council?",
    standardReference: "M. Laxmikanth Chapter 1"
  },
  {
    year: 1909,
    actTitle: "Indian Councils Act 1909 (Morley-Minto Reforms)",
    era: "Communal Representation",
    shortSummary: "Introduced separate electorates for Muslims and expanded legislative councils to divide nationalist cohesion.",
    keyProvisions: [
      "Introduced Separate Communal Electorates for Muslims (Lord Minto: 'Father of Communal Electorate').",
      "Allowed non-official majority in provincial legislative councils.",
      "Empowered members to discuss budget, ask supplementary questions, and move resolutions.",
      "Appointed Satyendra Prasad Sinha as the first Indian member in Viceroy's Executive Council (Law Member)."
    ],
    constitutionalLegacy: "Institutionalized religion-based political representation leading to long-term partition pressures.",
    pyqFrequency: 19,
    sampleQuestion: "Consider: 1. Introduced separate electorates. 2. Non-official majority in provinces. Which Act is this?",
    standardReference: "M. Laxmikanth Chapter 1 & Spectrum Chapter 13"
  },
  {
    year: 1919,
    actTitle: "Government of India Act 1919 (Montagu-Chelmsford Reforms)",
    era: "Dyarchy & Bicameralism",
    shortSummary: "Introduced Dyarchy in the provinces and bicameral legislature at the central government level.",
    keyProvisions: [
      "Introduced Dyarchy (Dual Rule) in provinces dividing subjects into 'Transferred' and 'Reserved'.",
      "Introduced Bicameralism (Council of State & Legislative Assembly) and direct elections at Center.",
      "Extended communal electorates to Sikhs, Indian Christians, Anglo-Indians, and Europeans.",
      "Provided for the establishment of a Central Public Service Commission (set up in 1926 under Lee Commission)."
    ],
    constitutionalLegacy: "Precursor to modern Union Public Service Commission (UPSC Art. 315) and bicameral Parliament.",
    pyqFrequency: 23,
    sampleQuestion: "Which of the following divided provincial subjects into Transferred and Reserved subjects under Dyarchy?",
    standardReference: "M. Laxmikanth Chapter 1 & Chapter 43"
  },
  {
    year: 1935,
    actTitle: "Government of India Act 1935",
    era: "Federal Blueprint of the Constitution",
    shortSummary: "The single largest constitutional document that formed the direct structural blueprint for the 1950 Indian Constitution.",
    keyProvisions: [
      "Provided for an All-India Federation consisting of provinces and princely states.",
      "Divided legislative powers into three lists: Federal List (59), Provincial List (54), and Concurrent List (36).",
      "Abolished Dyarchy in provinces and introduced Provincial Autonomy.",
      "Established the Federal Court (1937) and Reserve Bank of India (1935)."
    ],
    constitutionalLegacy: "Contributed more than 60% of structural provisions to the 1950 Constitution of India (emergency, federal lists, judiciary).",
    pyqFrequency: 29,
    sampleQuestion: "The distribution of powers between the Centre and the States in the Indian Constitution is based on which Act?",
    standardReference: "M. Laxmikanth Chapter 1 & Chapter 3"
  },
  {
    year: 1950,
    actTitle: "Constitution of India (Enactment & Republic)",
    era: "Sovereign Democratic Republic",
    shortSummary: "The supreme law of India establishing a sovereign, socialist, secular, democratic republic with fundamental rights and parliamentary federalism.",
    keyProvisions: [
      "Part III: Justiciable Fundamental Rights (Articles 12 to 35).",
      "Part IV: Directive Principles of State Policy (Articles 36 to 51).",
      "Article 356 & 360 Emergency architecture and independent judiciary (Articles 124–147).",
      "Independent Constitutional Bodies: Election Commission (324), CAG (148), UPSC (315), Finance Commission (280)."
    ],
    constitutionalLegacy: "Living constitutional document fortified by the Kesavananda Bharati Basic Structure Doctrine.",
    pyqFrequency: 34,
    sampleQuestion: "In which landmark case did the Supreme Court rule that the Basic Structure of the Constitution cannot be amended?",
    standardReference: "M. Laxmikanth (Entire Volume)"
  }
];

export const ChronoFactTimeline: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(4); // Default to 1935 Act
  const activeMilestone = MILESTONES[selectedIndex];

  return (
    <div className="p-6 bg-gradient-to-b from-[#131313] via-[#0f0f0f] to-[#080808] border border-neutral-800 rounded-3xl shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-850 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded-lg uppercase flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-400" />
              ChronoFact Temporal Knowledge Engine (1773–2026)
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-mono rounded">
              Constitutional Evolution Slider
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Statutory &amp; Historical Evolution Timeline
          </h2>
          <p className="text-xs text-neutral-400 font-sans max-w-xl">
            Slide across the timeline to trace how colonial acts evolved into the modern Constitution of India, with direct UPSC PYQ correlations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
          <Scale className="w-4 h-4 text-amber-400" />
          <span>Historical Weightage: High Yield</span>
        </div>
      </div>

      {/* Interactive Horizontal Slider Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2 text-xs font-mono text-neutral-400">
          <span>1773 (Company Rule)</span>
          <span className="text-amber-400 font-bold">Selected: {activeMilestone.year} ({activeMilestone.actTitle})</span>
          <span>1950 (Republic)</span>
        </div>

        {/* Year Pills Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {MILESTONES.map((m, idx) => (
            <button
              key={m.year}
              onClick={() => setSelectedIndex(idx)}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                selectedIndex === idx
                  ? "bg-amber-500 text-neutral-950 border-amber-500 font-black shadow-lg shadow-amber-500/20 scale-102"
                  : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
              }`}
            >
              <div className="text-sm font-black font-mono">{m.year}</div>
              <div className="text-[10px] truncate max-w-full font-sans mt-0.5 opacity-90">{m.actTitle.split("(")[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Milestone Card Breakdown */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMilestone.year}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="p-6 bg-[#151515] border border-neutral-800 rounded-2xl space-y-5 shadow-xl"
        >
          {/* Top Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold rounded">
                Era: {activeMilestone.era}
              </span>
              <h3 className="text-lg font-black text-white">{activeMilestone.actTitle}</h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">{activeMilestone.shortSummary}</p>
            </div>

            <div className="text-right font-mono">
              <div className="text-lg font-black text-amber-400">{activeMilestone.pyqFrequency} PYQs</div>
              <div className="text-[10px] text-neutral-400">18-Year Frequency (2009–2026)</div>
            </div>
          </div>

          {/* Key Provisions Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-amber-400 font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" /> Core Statutory Provisions &amp; Reforms
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeMilestone.keyProvisions.map((prov, pidx) => (
                <div key={pidx} className="p-3 bg-neutral-900 border border-neutral-850 rounded-xl text-xs text-neutral-200 flex items-start gap-2.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span className="leading-relaxed">{prov}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Constitutional Legacy & Sample Question */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-xl space-y-1.5">
              <div className="text-[10px] font-mono font-bold uppercase text-purple-300 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-purple-400" /> 1950 Constitutional Legacy
              </div>
              <p className="text-xs text-neutral-200">{activeMilestone.constitutionalLegacy}</p>
              <div className="text-[10px] font-mono text-purple-400 pt-1">Source: {activeMilestone.standardReference}</div>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sample UPSC Prelims Benchmark
                </div>
                <p className="text-xs text-neutral-200 italic font-serif">&ldquo;{activeMilestone.sampleQuestion}&rdquo;</p>
              </div>

              <Link
                href={`/arena?autoStart=true&count=5&subject=History&topic=${encodeURIComponent(activeMilestone.actTitle)}&mode=practice`}
                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow font-mono flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Solve {activeMilestone.year} Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
