"use client";

import React, { useState } from "react";
import { 
  Users, 
  Sparkles, 
  Send, 
  Mic, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Flame, 
  Scale, 
  Landmark, 
  Briefcase,
  Volume2,
  RefreshCw,
  Clock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BoardMember {
  id: string;
  name: string;
  title: string;
  role: string;
  persona: string;
  avatarBg: string;
  badgeColor: string;
  icon: any;
}

interface BoardDialogue {
  speakerId: "user" | string;
  speakerName: string;
  speakerRole?: string;
  text: string;
  timestamp: string;
  facetScore?: { name: string; score: number; maxScore: number };
}

const BOARD_MEMBERS: BoardMember[] = [
  {
    id: "member-1",
    name: "Dr. Arvind Swaminathan",
    title: "Senior Constitutional Jurist & Ex-Law Commission",
    role: "The Constitutional Skeptic",
    persona: "Scrutinizes statutory compliance, Supreme Court basic structure limits, and Article 163/200/356 federal bounds.",
    avatarBg: "from-blue-600 to-indigo-700",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: Scale
  },
  {
    id: "member-2",
    name: "Prof. Raghuram Sengupta",
    title: "Macroeconomist & Former Member, Finance Commission",
    role: "The Fiscal & Economic Skeptic",
    persona: "Evaluates revenue deficit feasibility, FRBM fiscal space, capital outlay vs revenue expenditure, and market incentives.",
    avatarBg: "from-emerald-600 to-teal-700",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: Landmark
  },
  {
    id: "member-3",
    name: "Smt. Meenakshi Sundaram IAS (Retd.)",
    title: "Former Chief Secretary & 2nd ARC Reformer",
    role: "The Administrative Realist",
    persona: "Probes grassroots execution bottlenecks, civil service integrity, district magistrate discretion, and Nolan ethics.",
    avatarBg: "from-amber-600 to-orange-700",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: Briefcase
  }
];

const EXAMINERS = BOARD_MEMBERS;

const INITIAL_DIALOGUES: BoardDialogue[] = [
  {
    speakerId: "member-1",
    speakerName: "Dr. Arvind Swaminathan",
    speakerRole: "The Constitutional Skeptic",
    text: "Cadet, welcome to the Socratic Boardroom. Consider the recent debates on gubernatorial discretion under Article 200. When a State Governor indefinitely withholds assent on state legislation passed by an elected assembly, does this violate the foundational doctrine of constitutional democracy and cooperative federalism?",
    timestamp: "10:02 AM"
  }
];

export const SocraticBoardroom: React.FC = () => {
  const [dialogues, setDialogues] = useState<BoardDialogue[]>(INITIAL_DIALOGUES);
  const [userInput, setUserInput] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  const TOPIC_PRESETS = [
    {
      title: "Gubernatorial Discretion & Federalism (Art. 200)",
      initialSpeaker: EXAMINERS[0],
      initialPrompt: "Cadet, consider the recent debates on gubernatorial discretion under Article 200. When a State Governor indefinitely withholds assent on state legislation passed by an elected assembly, does this violate the foundational doctrine of constitutional democracy and cooperative federalism?"
    },
    {
      title: "Sub-National Fiscal Deficits & Freebies (Art. 293 & FRBM)",
      initialSpeaker: EXAMINERS[1],
      initialPrompt: "Candidate, several state governments have reintroduced unfunded Old Pension Schemes (OPS) and off-budget borrowing guarantees. Under Article 293(3), does the Union have both the constitutional authority and moral duty to cap state borrowing limits, or does this infringe on state financial autonomy?"
    },
    {
      title: "Civil Service Neutrality vs Lateral Entry (2nd ARC)",
      initialSpeaker: EXAMINERS[2],
      initialPrompt: "As an aspirant for the senior civil service, how do you evaluate the institutional balance between career permanent civil servants (under Article 311) and specialized domain experts inducted through Lateral Entry at Joint Secretary levels? Does lateral entry erode bureaucratic institutional memory?"
    }
  ];

  const handleSelectTopic = (index: number) => {
    setActiveTopicIndex(index);
    const selected = TOPIC_PRESETS[index];
    setDialogues([
      {
        speakerId: selected.initialSpeaker.id,
        speakerName: selected.initialSpeaker.name,
        speakerRole: selected.initialSpeaker.role,
        text: selected.initialPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setUserInput("");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = userInput.trim();
    if (!text || isEvaluating) return;

    setUserInput("");
    const userMsg: BoardDialogue = {
      speakerId: "user",
      speakerName: "Candidate (You)",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setDialogues((prev) => [...prev, userMsg]);
    setIsEvaluating(true);

    const words = text.split(/\s+/).filter(Boolean);
    const textLower = text.toLowerCase();
    const isFlippantOrTooShort = words.length < 6 || textLower === "ok" || textLower === "yes" || textLower === "no" || textLower === "asdf" || textLower === "test";

    setTimeout(() => {
      if (isFlippantOrTooShort) {
        // Strict Reprimand for low effort or one-word response
        const reprimandMsg: BoardDialogue = {
          speakerId: EXAMINERS[0].id,
          speakerName: EXAMINERS[0].name,
          speakerRole: EXAMINERS[0].role,
          text: `Cadet, '${text}' is completely unacceptable in a UPSC Personality Boardroom interview. An administrative aspirant must present reasoned constitutional arguments, statutory backing, or empirical trade-offs. You are awarded zero credit for non-substantive statements. Please formulate a rigorous, structured response.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          facetScore: { name: "Substantive Reasoning & Articulation", score: 1.0, maxScore: 10 }
        };
        setDialogues((prev) => [...prev, reprimandMsg]);
        setIsEvaluating(false);
        return;
      }

      // Substantive Evaluation & Next Examiner Cross-Examination
      const hasConstitutionalKeywords = textLower.includes("article") || textLower.includes("supreme court") || textLower.includes("federal") || textLower.includes("constitution") || textLower.includes("governor") || textLower.includes("judicial") || textLower.includes("shamsher") || textLower.includes("nabam rebia");
      const hasEconomicKeywords = textLower.includes("fiscal") || textLower.includes("frbm") || textLower.includes("revenue") || textLower.includes("borrowing") || textLower.includes("budget") || textLower.includes("expenditure") || textLower.includes("gdp");
      const hasAdministrativeKeywords = textLower.includes("administration") || textLower.includes("district") || textLower.includes("governance") || textLower.includes("policy") || textLower.includes("ethics") || textLower.includes("implementation");

      let calculatedScore = 6.0;
      if (words.length > 25) calculatedScore += 1.5;
      if (hasConstitutionalKeywords || hasEconomicKeywords || hasAdministrativeKeywords) calculatedScore += 1.5;
      calculatedScore = Math.min(9.5, Math.max(4.0, calculatedScore));

      const responses: BoardDialogue[] = [];

      // Response from Fiscal / Legal Examiner
      responses.push({
        speakerId: EXAMINERS[1].id,
        speakerName: EXAMINERS[1].name,
        speakerRole: EXAMINERS[1].role,
        text: `You have raised pertinent points regarding the institutional balance. However, let us interrogate the financial and practical implications: when sub-national political exigencies collide with long-term fiscal solvency, what institutional safeguards prevent populism from crippling essential public capital formation under Article 280 & 293?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        facetScore: { name: "Constitutional & Structural Analysis", score: calculatedScore, maxScore: 10 }
      });

      // Follow-up from Administrative Realist
      responses.push({
        speakerId: EXAMINERS[2].id,
        speakerName: EXAMINERS[2].name,
        speakerRole: EXAMINERS[2].role,
        text: `As a future District Magistrate or Secretary to Government, how will you practically enforce compliance on the ground when political executive directives conflict with established statutory procedures? What ethical decision-making framework will you deploy?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        facetScore: { name: "Administrative Feasibility & Ethics", score: Math.max(5.0, calculatedScore - 0.5), maxScore: 10 }
      });

      setDialogues((prev) => [...prev, ...responses]);
      setIsEvaluating(false);
    }, 1200);
  };

  const handleResetSession = () => {
    handleSelectTopic(activeTopicIndex);
  };

  return (
    <div className="p-6 bg-gradient-to-b from-[#141414] via-[#101010] to-[#0a0a0a] border border-neutral-800 rounded-3xl shadow-2xl space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-neutral-850 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded-lg uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Socratic Boardroom (Multi-Agent Mains Interview Evaluator)
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-mono rounded">
              3 Specialized AI Examiners
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            High-Stakes Personality Test &amp; Oral Defense Panel
          </h2>
          <p className="text-xs text-neutral-400 font-sans max-w-2xl">
            Defend your policy stance in real time before three autonomous AI board members interrogating legal bounds, macroeconomic viability, and administrative execution.
          </p>
        </div>

        <button
          onClick={handleResetSession}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Reset Defense</span>
        </button>
      </div>

      {/* Oral Defense Topic Scenario Selector */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-neutral-950 border border-neutral-850 rounded-2xl">
        <span className="text-[11px] font-mono font-bold text-neutral-400 px-2">Scenario:</span>
        {TOPIC_PRESETS.map((t, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectTopic(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTopicIndex === idx
                ? "bg-purple-600 text-white font-black shadow-md"
                : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Board Members Profile Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BOARD_MEMBERS.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} className="p-4 bg-neutral-900/70 border border-neutral-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${m.avatarBg} flex items-center justify-center text-white font-black text-sm shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{m.name}</div>
                  <div className="text-[10px] text-neutral-400 font-mono">{m.title}</div>
                </div>
              </div>
              <p className="text-[11px] text-neutral-300 leading-snug">{m.persona}</p>
            </div>
          );
        })}
      </div>

      {/* Live Dialogue Stream */}
      <div className="p-4 bg-[#080808] border border-neutral-850 rounded-2xl space-y-4 max-h-[460px] overflow-y-auto">
        {dialogues.map((d, idx) => {
          const isUser = d.speakerId === "user";

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 px-1">
                <span className={`font-bold ${isUser ? "text-amber-400" : "text-neutral-200"}`}>
                  {d.speakerName}
                </span>
                {d.speakerRole && <span>• {d.speakerRole}</span>}
                <span>• {d.timestamp}</span>
              </div>

              <div
                className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed font-sans ${
                  isUser
                    ? "bg-amber-500/10 border border-amber-500/40 text-amber-100 rounded-br-none"
                    : "bg-[#141414] border border-neutral-800 text-neutral-200 rounded-bl-none shadow-lg"
                }`}
              >
                {d.text}

                {/* Score Rubric Chip if present */}
                {d.facetScore && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {d.facetScore.name}
                    </span>
                    <span className="font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                      Score: {d.facetScore.score} / {d.facetScore.maxScore}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {isEvaluating && (
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 p-3 bg-neutral-900/60 rounded-xl">
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Board members are conferring and formulating multi-perspective counter-questions...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Articulate your structured answer or defense before the Boardroom..."
          disabled={isEvaluating}
          className="w-full bg-[#121212] border border-neutral-800 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-sans shadow-lg"
        />

        <button
          type="submit"
          disabled={isEvaluating || !userInput.trim()}
          className="px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 font-mono"
        >
          <span>Respond</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
};
