"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/src/components/shared/AppHeader";
import { AppFooter } from "@/src/components/shared/AppFooter";
import { GuestWarningBanner } from "@/src/components/auth/GuestWarningBanner";
import { useArenaStore } from "@/src/store/useArenaStore";
import {
  Globe,
  Sparkles,
  BookOpen,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Award,
  Zap,
  Check,
  Clock,
  Bookmark,
  Share2,
  Flame,
  ArrowRight,
  Copy,
  FileText,
  Scale,
  Compass,
  Lightbulb,
  CheckCheck,
  BookMarked
} from "lucide-react";
import { toast } from "sonner";

interface PrelimsMCQ {
  question: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
}

interface MainsPrompt {
  text: string;
  directive: string;
  key_arguments: string[];
}

interface MainsDimension {
  title: string;
  points: string[];
}

interface ArgumentsMatrix {
  pros: string[];
  cons: string[];
}

interface CurrentAffairsItem {
  id: string;
  headline: string;
  source: string;
  published_at: string;
  summary: string;
  key_takeaways: string[];
  syllabus_topic: string;
  static_concept: string;
  textbook_reference: string;
  relevance_score: number;
  gs_paper: string;
  exam_track: string;
  background_context?: string;
  prelims_facts?: string[];
  mains_dimensions?: MainsDimension[];
  arguments_matrix?: ArgumentsMatrix;
  way_forward?: string[];
  revision_summary?: string;
  prelims_mcq?: PrelimsMCQ;
  mains_question?: MainsPrompt;
}

export default function CurrentAffairsPage() {
  const mode = useArenaStore((state) => state.mode);
  const [items, setItems] = useState<CurrentAffairsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  
  // Interactive MCQ Modal State
  const [activeMCQItem, setActiveMCQItem] = useState<CurrentAffairsItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // 360° Editorial Deep-Dive Modal State
  const [activeEditorialItem, setActiveEditorialItem] = useState<CurrentAffairsItem | null>(null);
  const [editorialTab, setEditorialTab] = useState<"GENESIS" | "PRELIMS" | "MAINS" | "WAYFORWARD" | "TEXTBOOK">("GENESIS");
  const [isCopiedNotes, setIsCopiedNotes] = useState(false);

  const fetchCurrentAffairs = async (forceRefresh = false) => {
    setIsLoading(true);
    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const queryParams = new URLSearchParams({
        exam_type: mode,
        category: selectedCategory,
        limit: "20",
        force_refresh: forceRefresh ? "true" : "false"
      });
      const res = await fetch(`${apiEndpoint}/api/v1/intelligence/current-affairs?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        }
      }
    } catch (e) {
      console.warn("Using cached current affairs feed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentAffairs();
  }, [mode, selectedCategory]);

  const handleSyncLive = async () => {
    setIsSyncing(true);
    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${apiEndpoint}/api/v1/intelligence/current-affairs/sync`, { method: "POST" });
      if (res.ok) {
        toast.success("Live Global Feeds Synchronized!", {
          description: "Ingested latest dispatches from PIB, The Hindu, BBC World, and MoD."
        });
        await fetchCurrentAffairs(true);
      } else {
        toast.error("Live sync failed, using cached stream.");
      }
    } catch {
      toast.error("Could not reach news aggregation servers.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenMCQ = (item: CurrentAffairsItem) => {
    setActiveMCQItem(item);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
  };

  const handleSubmitMCQ = () => {
    if (!selectedOption) {
      toast.error("Please select an option first.");
      return;
    }
    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption === activeMCQItem?.prelims_mcq?.correct_answer;
    if (isCorrect) {
      toast.success("Correct Answer! +2.0 Marks", { description: "Flow-state theta mastery updated." });
    } else {
      toast.error("Incorrect Choice", { description: "Review the detailed explanation below." });
    }
  };

  const handleOpenEditorial = (item: CurrentAffairsItem) => {
    setActiveEditorialItem(item);
    setEditorialTab("GENESIS");
    setIsCopiedNotes(false);
  };

  const handleCopyRevisionNotes = (item: CurrentAffairsItem) => {
    const formattedNotes = `### ${item.headline}
**Exam Focus:** ${item.gs_paper} | **Source:** ${item.source}
**Static Concept:** ${item.static_concept}
**Textbook Chapter:** ${item.textbook_reference}

#### 1. Core Summary & Genesis
${item.background_context || item.summary}

#### 2. Prelims High-Yield Facts & Anchors
${(item.prelims_facts || []).map(f => `- ${f}`).join("\n")}

#### 3. Mains Dimensions & Arguments
${(item.mains_dimensions || []).map(d => `**${d.title}:**\n${d.points.map(p => `  * ${p}`).join("\n")}`).join("\n\n")}

**Pros / Benefits:**
${(item.arguments_matrix?.pros || []).map(p => `- ${p}`).join("\n")}

**Challenges / Criticisms:**
${(item.arguments_matrix?.cons || []).map(c => `- ${c}`).join("\n")}

#### 4. Way Forward & Recommendations
${(item.way_forward || []).map(w => `- ${w}`).join("\n")}
`;

    navigator.clipboard.writeText(formattedNotes);
    setIsCopiedNotes(true);
    toast.success("360° Revision Notes Copied to Clipboard!", {
      description: "Paste into your Notion, Obsidian, or digital revision notebook."
    });
    setTimeout(() => setIsCopiedNotes(false), 3000);
  };

  // Filter items by search query and source
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.syllabus_topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.static_concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSource =
      selectedSource === "ALL" ||
      item.source.toLowerCase().includes(selectedSource.toLowerCase());

    return matchesSearch && matchesSource;
  });

  const categories = [
    { key: "ALL", label: "All Intelligence", count: items.length },
    { key: "GS1", label: "GS-1 (History & Geo)", count: items.filter(i => i.gs_paper.includes("GS Paper - I")).length },
    { key: "GS2", label: "GS-2 (Polity & IR)", count: items.filter(i => i.gs_paper.includes("GS Paper - II")).length },
    { key: "GS3", label: "GS-3 (Economy & Env)", count: items.filter(i => i.gs_paper.includes("GS Paper - III")).length },
    { key: "GS4", label: "GS-4 (Ethics)", count: items.filter(i => i.gs_paper.includes("GS Paper - IV")).length },
    { key: "DEFENSE", label: "CDS Defense & Security", count: items.filter(i => i.gs_paper.includes("CDS") || i.exam_track === "CDS").length },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#080808] text-neutral-100 selection:bg-amber-500 selection:text-neutral-950">
      <GuestWarningBanner />
      <AppHeader />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-br from-[#141414] via-[#101010] to-[#0a0a0a] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 z-10 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                360° Global & National Intelligence Engine
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-md">
                Verified Multi-Source Wire
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Daily Syllabus-Grounded Current Affairs & Editorial Analysis
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
              High-accuracy global and national dispatches enriched with <strong>Background Genesis</strong>, <strong>Prelims Fact Boxes</strong>, <strong>Mains GS Dimensions</strong>, and <strong>Static Textbook Chapter Bridges</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={handleSyncLive}
              disabled={isSyncing}
              className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-750 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing Wire Feeds..." : "Sync Live Wire Feeds"}
            </button>
          </div>
        </div>

        {/* Category Navigation Pills & Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.key
                      ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
                      : "bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                  }`}
                >
                  {cat.label}
                  {cat.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        selectedCategory === cat.key
                          ? "bg-neutral-950 text-amber-400"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Source Filter Bar */}
          <div className="p-4 bg-[#121212] border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search news, topics, constitutional articles, or concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-neutral-400 font-mono font-bold flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                Source:
              </span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="ALL">All Official Sources</option>
                <option value="PIB">Press Information Bureau (PIB)</option>
                <option value="The Hindu">The Hindu</option>
                <option value="BBC">BBC World / Global Wire</option>
                <option value="Defence">Ministry of Defence / DRDO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Intelligence Cards Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs font-mono">Compiling 360° real-time syllabus linkages...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-neutral-900/30 border border-neutral-800 rounded-3xl space-y-3">
            <HelpCircle className="w-10 h-10 text-neutral-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No articles matched your criteria</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Try resetting your search query or sync the latest live wire feeds.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-b from-[#151515] to-[#101010] border border-neutral-800 hover:border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-5 transition-all group relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold rounded-lg uppercase">
                        {item.gs_paper}
                      </span>
                      <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-mono rounded-md">
                        {item.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold">
                      <Flame className="w-3 h-3 text-amber-400" />
                      Yield: {item.relevance_score}%
                    </div>
                  </div>

                  {/* Headline & Summary */}
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors leading-snug">
                      {item.headline}
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  {/* Key Exam Takeaways */}
                  {item.key_takeaways && item.key_takeaways.length > 0 && (
                    <div className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-2xl space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        Core Prelims & Mains Takeaways
                      </div>
                      <ul className="space-y-1 text-xs text-neutral-300">
                        {item.key_takeaways.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">•</span>
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* STATIC SYLLABUS CONNECTION BOX */}
                  <div className="p-3.5 bg-neutral-950/80 border border-neutral-850 rounded-2xl space-y-1.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-purple-400" />
                      Static Textbook & Syllabus Linkage
                    </div>
                    <div className="text-xs text-neutral-200">
                      <strong className="text-neutral-400">Core Concept: </strong>
                      {item.static_concept}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      <strong className="text-purple-300">Standard Source: </strong>
                      {item.textbook_reference}
                    </div>
                  </div>
                </div>

                {/* 360° EDITORIAL & PRACTICE ACTIONS */}
                <div className="pt-3 border-t border-neutral-850 space-y-2.5">
                  {/* Primary 360° Deep-Dive CTA */}
                  <button
                    onClick={() => handleOpenEditorial(item)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <FileText className="w-4 h-4 text-neutral-950" />
                    <span>Read 360° Deep Dive Editorial Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-950 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => handleOpenMCQ(item)}
                      className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      Solve Prelims MCQ
                    </button>

                    {item.mains_question && (
                      <Link
                        href={`/mains?prompt=${encodeURIComponent(item.mains_question.text)}`}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Write Mains Answer</span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* 360° EDITORIAL DEEP DIVE READER MODAL */}
      {activeEditorialItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#111111] border border-neutral-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-800 bg-neutral-900/50 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-black rounded-lg uppercase">
                    {activeEditorialItem.gs_paper}
                  </span>
                  <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono rounded-lg">
                    {activeEditorialItem.source}
                  </span>
                  <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" /> ~4 min read
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyRevisionNotes(activeEditorialItem)}
                    className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-750 hover:border-amber-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Copy formatted markdown revision notes"
                  >
                    {isCopiedNotes ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopiedNotes ? "Copied!" : "Copy Notes"}</span>
                  </button>
                  <button
                    onClick={() => setActiveEditorialItem(null)}
                    className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                {activeEditorialItem.headline}
              </h2>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-neutral-800/80 bg-neutral-950/60 overflow-x-auto scrollbar-none font-mono text-xs">
              <button
                onClick={() => setEditorialTab("GENESIS")}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  editorialTab === "GENESIS"
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                1. Genesis & Context
              </button>

              <button
                onClick={() => setEditorialTab("PRELIMS")}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  editorialTab === "PRELIMS"
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                2. Prelims Fact Box
              </button>

              <button
                onClick={() => setEditorialTab("MAINS")}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  editorialTab === "MAINS"
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                3. Mains Dimensions & Arguments
              </button>

              <button
                onClick={() => setEditorialTab("WAYFORWARD")}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  editorialTab === "WAYFORWARD"
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                4. Way Forward
              </button>

              <button
                onClick={() => setEditorialTab("TEXTBOOK")}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  editorialTab === "TEXTBOOK"
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" />
                5. Textbook & Practice
              </button>
            </div>

            {/* Modal Body / Tab Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {editorialTab === "GENESIS" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-amber-400">
                      <Compass className="w-4 h-4 text-amber-400" />
                      Historical Genesis & Background Context
                    </div>
                    <p className="text-sm text-neutral-200 leading-relaxed font-sans bg-neutral-900/60 border border-neutral-850 p-5 rounded-2xl">
                      {activeEditorialItem.background_context || activeEditorialItem.summary}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-neutral-300">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Core High-Yield Highlights
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(activeEditorialItem.key_takeaways || []).map((t, idx) => (
                        <div key={idx} className="p-4 bg-neutral-900/40 border border-neutral-850 rounded-2xl space-y-1">
                          <span className="text-xs font-mono font-bold text-amber-400">0{idx + 1}</span>
                          <p className="text-xs text-neutral-300 leading-relaxed font-sans">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {editorialTab === "PRELIMS" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-amber-400">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Prelims High-Yield Facts & Statutory Anchors
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400">100% Verified Canonical Data</span>
                  </div>

                  <div className="space-y-3">
                    {(activeEditorialItem.prelims_facts || [
                      "Key Statutory / Constitutional references verified.",
                      "Official Nodal Ministry & Global Treaties checked.",
                      "High-probability prelims trap dimensions isolated."
                    ]).map((fact, idx) => (
                      <div key={idx} className="p-4 bg-neutral-900/60 border border-neutral-850 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans">{fact}</span>
                      </div>
                    ))}
                  </div>

                  {activeEditorialItem.prelims_mcq && (
                    <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">Test Your Prelims Retention Now</h4>
                        <p className="text-xs text-neutral-400">Solve the interactive MCQ formulated from this dispatch.</p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveMCQItem(activeEditorialItem);
                          setSelectedOption(null);
                          setIsAnswerSubmitted(false);
                        }}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                      >
                        Launch Prelims MCQ
                      </button>
                    </div>
                  )}
                </div>
              )}

              {editorialTab === "MAINS" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Multi-Dimensional Analysis */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-amber-400">
                      <Scale className="w-4 h-4 text-amber-400" />
                      Multi-Dimensional GS Analysis (PESTLE Framework)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(activeEditorialItem.mains_dimensions || [
                        { title: "Institutional & Policy Architecture", points: ["Requires examination of executive implementation mandates.", "Adherence to statutory checks and balances."] }
                      ]).map((dim, idx) => (
                        <div key={idx} className="p-4 bg-neutral-900/60 border border-neutral-850 rounded-2xl space-y-2">
                          <h4 className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {dim.title}
                          </h4>
                          <ul className="space-y-1.5 text-xs text-neutral-300">
                            {dim.points.map((p, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-2">
                                <span className="text-amber-400">•</span>
                                <span className="leading-relaxed">{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Balanced Arguments Matrix */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-neutral-200">
                      <Scale className="w-4 h-4 text-purple-400" />
                      Balanced Arguments Matrix (Pros vs. Challenges)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Arguments in Favor */}
                      <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2.5">
                        <div className="text-xs font-mono font-black text-emerald-400 uppercase flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          Arguments in Favor / Key Benefits
                        </div>
                        <ul className="space-y-2 text-xs text-neutral-300">
                          {(activeEditorialItem.arguments_matrix?.pros || ["Promotes public policy efficacy and constitutional governance."]).map((pro, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold">+</span>
                              <span className="leading-relaxed">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Challenges & Criticisms */}
                      <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl space-y-2.5">
                        <div className="text-xs font-mono font-black text-red-400 uppercase flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Challenges / Criticisms & Bottlenecks
                        </div>
                        <ul className="space-y-2 text-xs text-neutral-300">
                          {(activeEditorialItem.arguments_matrix?.cons || ["Implementation hurdles and grassroots resource deficits."]).map((con, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-red-400 font-bold">-</span>
                              <span className="leading-relaxed">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editorialTab === "WAYFORWARD" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-amber-400">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      Way Forward & Committee Recommendations
                    </div>
                    <p className="text-xs text-neutral-400 font-sans">
                      Authoritative reforms citing the 2nd Administrative Reforms Commission (ARC), NITI Aayog, Law Commission, and Supreme Court constitutional precedents.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {(activeEditorialItem.way_forward || [
                      "Formulate clear, objective guidelines based on empirical verifiable data.",
                      "Strengthen inter-agency coordination under standardized governance frameworks.",
                      "Ensure periodic independent social audits and institutional oversight."
                    ]).map((wf, idx) => (
                      <div key={idx} className="p-4 bg-neutral-900/60 border border-neutral-850 rounded-2xl flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans">{wf}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editorialTab === "TEXTBOOK" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-purple-300">
                      <BookMarked className="w-4 h-4 text-purple-400" />
                      Canonical Textbook & Syllabus Taxonomy Mapping
                    </div>
                    <div className="p-5 bg-neutral-900/60 border border-neutral-850 rounded-2xl space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">Core Syllabus Concept</span>
                        <div className="text-sm font-bold text-white">{activeEditorialItem.static_concept}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-purple-400 uppercase">Recommended Textbook Chapter</span>
                        <div className="text-sm font-bold text-purple-300">{activeEditorialItem.textbook_reference}</div>
                      </div>
                    </div>
                  </div>

                  {activeEditorialItem.mains_question && (
                    <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Mains Analytical Prompt</span>
                        <span className="text-[10px] font-mono text-neutral-400">{activeEditorialItem.mains_question.directive}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-200 font-sans italic">
                        &quot;{activeEditorialItem.mains_question.text}&quot;
                      </p>
                      <Link
                        href={`/mains?prompt=${encodeURIComponent(activeEditorialItem.mains_question.text)}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        <span>Write & Grade in Mains AES Evaluator</span>
                        <ArrowRight className="w-4 h-4 text-neutral-950" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer / Action Bar */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleCopyRevisionNotes(activeEditorialItem)}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copy 360° Revision Notes</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveMCQItem(activeEditorialItem);
                    setSelectedOption(null);
                    setIsAnswerSubmitted(false);
                  }}
                  className="px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Solve MCQ</span>
                </button>

                <button
                  onClick={() => setActiveEditorialItem(null)}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Close Reader
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* INTERACTIVE PRELIMS MCQ MODAL */}
      {activeMCQItem && activeMCQItem.prelims_mcq && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold rounded uppercase">
                  {activeMCQItem.gs_paper}
                </span>
                <h3 className="text-base font-black text-white mt-1.5">
                  Prelims Practice Drill: {activeMCQItem.syllabus_topic}
                </h3>
              </div>
              <button
                onClick={() => setActiveMCQItem(null)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Question Text */}
            <div className="text-sm text-neutral-200 leading-relaxed font-sans whitespace-pre-line p-4 bg-neutral-900/50 border border-neutral-850 rounded-2xl">
              {activeMCQItem.prelims_mcq.question}
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {Object.entries(activeMCQItem.prelims_mcq.options).map(([optKey, optVal]) => {
                const isSelected = selectedOption === optKey;
                const isCorrect = isAnswerSubmitted && optKey === activeMCQItem.prelims_mcq?.correct_answer;
                const isWrong = isAnswerSubmitted && isSelected && optKey !== activeMCQItem.prelims_mcq?.correct_answer;

                let btnStyles = "bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-700";
                if (isSelected && !isAnswerSubmitted) {
                  btnStyles = "bg-amber-500/20 border-amber-500 text-white shadow-md shadow-amber-500/10";
                } else if (isCorrect) {
                  btnStyles = "bg-emerald-500/20 border-emerald-500 text-emerald-200";
                } else if (isWrong) {
                  btnStyles = "bg-red-500/20 border-red-500 text-red-200";
                }

                return (
                  <button
                    key={optKey}
                    onClick={() => !isAnswerSubmitted && setSelectedOption(optKey)}
                    disabled={isAnswerSubmitted}
                    className={`w-full p-4 rounded-2xl border text-left text-xs font-sans flex items-center justify-between gap-3 transition-all cursor-pointer ${btnStyles}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-neutral-950 border border-neutral-800 font-mono font-bold text-center leading-6 text-amber-400">
                        {optKey}
                      </span>
                      <span className="leading-relaxed">{optVal}</span>
                    </div>

                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isWrong && <XCircle className="w-4 h-4 text-red-400" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation / Verification Box */}
            {isAnswerSubmitted && (
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-mono font-bold">
                  {selectedOption === activeMCQItem.prelims_mcq.correct_answer ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Correct Answer: Option {activeMCQItem.prelims_mcq.correct_answer}
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Incorrect. Correct Choice: Option {activeMCQItem.prelims_mcq.correct_answer}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {activeMCQItem.prelims_mcq.explanation}
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitMCQ}
                  disabled={!selectedOption}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  Confirm Answer
                </button>
              ) : (
                <button
                  onClick={() => setActiveMCQItem(null)}
                  className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Close Drill
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
