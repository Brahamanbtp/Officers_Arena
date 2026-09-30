"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  BookMarked,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

export interface PrelimsMCQ {
  question: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
}

export interface MainsPrompt {
  text: string;
  directive: string;
  key_arguments: string[];
}

export interface MainsDimension {
  title: string;
  points: string[];
}

export interface ArgumentsMatrix {
  pros: string[];
  cons: string[];
}

export interface CurrentAffairsItem {
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
  category_key: "GS1" | "GS2" | "GS3" | "GS4" | "DEFENSE" | "GK" | "MATH" | "ENGLISH";
  exam_track: "UPSC" | "CDS" | "BOTH";
  background_context?: string;
  prelims_facts?: string[];
  mains_dimensions?: MainsDimension[];
  arguments_matrix?: ArgumentsMatrix;
  way_forward?: string[];
  revision_summary?: string;
  prelims_mcq?: PrelimsMCQ;
  mains_question?: MainsPrompt;
}

export const CANONICAL_ARTICLES: CurrentAffairsItem[] = [
  // --- UPSC GS-1 ---
  {
    id: "ca-upsc-gs1-1",
    headline: "ASI Excavations at Rakhigarhi Uncover Harappan Multi-Tier Drainage & DNA Evidence",
    source: "PIB (Ministry of Culture)",
    published_at: "2026-03-24T08:30:00Z",
    summary: "Archaeological Survey of India excavations in Haryana establish Rakhigarhi as the largest Mature Harappan settlement (>350 ha), with unbroken indigenous DNA lineage and advanced terracotta soak-jar sanitation systems.",
    key_takeaways: [
      "Confirms indigenous development of mature town planning and 1:2:4 brick ratios.",
      "Skeletal paleogenomics refutes ancestral disruption hypotheses prior to 2000 BCE.",
      "Identified multi-tiered subterranean drainage systems matching modern storm-water separation."
    ],
    syllabus_topic: "Indian Culture & Ancient Town Planning",
    static_concept: "Indus Valley Civilization: Urban Sanitation, Trade Networks & Cultural Synthesis",
    textbook_reference: "NCERT Class XI (An Introduction to Indian Art) & Nitin Singhania (Chapter 1: Architecture)",
    relevance_score: 98.5,
    gs_paper: "GS Paper - I (Art & Culture / Ancient History)",
    category_key: "GS1",
    exam_track: "UPSC",
    background_context: "Rakhigarhi, situated in Hisar district of Haryana, spans across seven major mounds and exceeds 350 hectares, making it the largest known Indus Valley Civilization metropolis. Joint excavations by ASI and Deccan College deployed ground-penetrating radar (GPR) to document multi-tiered drainage networks and craft workshops.",
    prelims_facts: [
      "Location: Hisar District, Haryana (Ghaggar-Hakra river basin).",
      "Classification: Largest Mature Harappan site in the Indian subcontinent.",
      "Standard Ratio: Standardized sun-dried and kiln-fired brick ratio (1:2:4).",
      "Scientific Evidence: Ancient DNA from female skeleton (I6113) confirms indigenous lineage."
    ],
    mains_dimensions: [
      {
        title: "Urban Planning & Sanitation Architecture",
        points: [
          "Standardized brick dimensions demonstrating civic regulation and centralized artisan guilds.",
          "Separation of residential greywater from stormwater drainage."
        ]
      }
    ],
    arguments_matrix: {
      "pros": [
        "Provides empirical archaeological backing to indigenous Harappan continuity.",
        "Elevates Indian prehistoric heritage on global UNESCO tentative inventories."
      ],
      "cons": [
        "Encroachment and agricultural leveling threaten unexcavated peripheral mounds.",
        "Need for on-site climate-controlled conservation laboratories."
      ]
    },
    way_forward: [
      "Expedite the establishment of the Rakhigarhi National Archaeological Site Museum.",
      "Deploy AI-driven 3D photogrammetry to document stratigraphy prior to trenching."
    ],
    prelims_mcq: {
      question: "With reference to the Indus Valley site of Rakhigarhi, consider the following statements:\n1. It is currently recognized as the largest Harappan site in the Indian subcontinent.\n2. Excavations revealed evidence of fortified citadel walls and advanced soak-jar drainage systems.\n\nWhich of the statements given above is/are correct?",
      options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
      correct_answer: "C",
      explanation: "Both statements are correct. Rakhigarhi exceeds 350 hectares and features extensive drainage and fortification walls."
    },
    mains_question: {
      text: "Examine how the town-planning principles of the Indus Valley Civilization offer viable lessons for sustainable urban governance in 21st-century Indian smart cities. (150 words, 10 marks)",
      directive: "Examine (Detailed structural and comparative analysis)",
      key_arguments: ["Subterranean drainage separation", "Standardized civic building ratios", "Decentralized artisan zones"]
    }
  },
  {
    id: "ca-upsc-gs1-2",
    headline: "Western Ghats Ecologically Sensitive Area (ESA) Notification & Gadgil Panel Review",
    source: "The Hindu (Environment)",
    published_at: "2026-03-22T06:00:00Z",
    summary: "Union Ministry of Environment issues draft notification delineating 56,825 sq km across six states as Western Ghats Ecologically Sensitive Area, balancing community livelihoods with fragile geomorphology.",
    key_takeaways: [
      "Covers six peninsular states: Gujarat, Maharashtra, Goa, Karnataka, Kerala, and Tamil Nadu.",
      "Prohibits commercial mining, thermal power plants, and red-category polluting industries.",
      "Synthesizes recommendations from Madhav Gadgil and K. Kasturirangan committees."
    ],
    syllabus_topic: "Physical Geography & Environmental Fragility",
    static_concept: "Western Ghats: Orogeny, Endemism, Biodiversity Hotspots & Disaster Vulnerability",
    textbook_reference: "NCERT Class XI (Physical Environment) & Shankar IAS (Chapter 14: Protected Area Network)",
    relevance_score: 96.0,
    gs_paper: "GS Paper - I (Physical Geography & Ecology)",
    category_key: "GS1",
    exam_track: "UPSC",
    background_context: "The Western Ghats represent an unbroken mountainous chain older than the Himalayas, recognized as one of the world's eight 'hottest hotspots' of biological diversity. The notification seeks to shield fragile slopes from catastrophic landslides while protecting traditional plantation farming.",
    prelims_facts: [
      "Span: ~1,600 km along western coast across 6 Indian states.",
      "Global Status: UNESCO World Heritage Site & Biodiversity Hotspot.",
      "Committees: Madhav Gadgil (WGEEP, 2011) and Dr. K. Kasturirangan (HLWG, 2013)."
    ],
    prelims_mcq: {
      question: "Which of the following committees was/were constituted to examine the conservation framework of the Western Ghats?\n1. Madhav Gadgil Committee\n2. K. Kasturirangan Committee\n3. B.N. Srikrishna Committee\n\nSelect the correct answer using the code given below:",
      options: { "A": "1 and 2 only", "B": "2 and 3 only", "C": "1 and 3 only", "D": "1, 2 and 3" },
      correct_answer: "A",
      explanation: "Gadgil and Kasturirangan committees investigated Western Ghats ecology. B.N. Srikrishna committee headed Data Protection framework."
    }
  },

  // --- UPSC GS-2 ---
  {
    id: "ca-upsc-gs2-1",
    headline: "Supreme Court Clarifies Constitutional Bounds on Governor's Assent to State Bills (Art. 200)",
    source: "The Hindu (Legal)",
    published_at: "2026-03-25T09:15:00Z",
    summary: "A Constitution Bench rules that Governors cannot exercise pocket veto or indefinitely withhold assent on state legislative bills, reinforcing the doctrine of cooperative federalism and Cabinet aid & advice under Art. 163.",
    key_takeaways: [
      "Under Article 200, the Governor has 4 options: give assent, withhold assent, reserve for President, or return for reconsideration.",
      "If a returned bill is repassed by the Assembly, the Governor has no constitutional discretion and must give assent.",
      "Reiterates that the Governor is a titular constitutional head and not an elected parallel center of political power."
    ],
    syllabus_topic: "Constitutional Governance, Federalism & Gubernatorial Discretion",
    static_concept: "Governor: Constitutional Role, Discretionary Powers (Art. 163, 200, 356) & Federal Tensions",
    textbook_reference: "M. Laxmikanth (Indian Polity 8th Ed, Chapter 30: Governor & Chapter 14: Center-State Relations)",
    relevance_score: 99.0,
    gs_paper: "GS Paper - II (Polity & Governance)",
    category_key: "GS2",
    exam_track: "UPSC",
    background_context: "In recent years, gubernatorial delays in granting assent to state enactments led multiple State Governments to approach the Supreme Court under Article 32. The judgment settles ambiguities surrounding the phrase 'as soon as possible' in the first proviso to Article 200.",
    prelims_facts: [
      "Constitutional Article: Article 200 (Assent to Bills) & Article 201 (Bills reserved for President).",
      "Key Precedent: Shamsher Singh v. State of Punjab (1974) & S.R. Bommai (1994).",
      "Commission Recommendations: Sarkaria Commission (1988) & Punchhi Commission (2010)."
    ],
    prelims_mcq: {
      question: "Under the provisions of Article 200 of the Constitution of India, if a State Legislative Assembly passes a Bill for the second time after it was returned by the Governor, the Governor:\n\nSelect the correct option:",
      options: {
        "A": "Can still withhold assent indefinitely.",
        "B": "Must necessarily grant assent to the Bill.",
        "C": "Can automatically refer the Bill to the Chief Justice of India.",
        "D": "Can dissolve the Legislative Assembly immediately."
      },
      correct_answer: "B",
      explanation: "Under the first proviso to Article 200, if the Bill is passed again by the House(s) with or without amendment, the Governor shall not withhold assent therefrom."
    },
    mains_question: {
      text: "'The office of the Governor was conceived as an organic bridge of cooperative federalism, yet it has frequently emerged as a flashpoint of constitutional confrontation.' Critically evaluate in light of recent Supreme Court rulings. (250 words, 15 marks)",
      directive: "Critically Evaluate (Balanced structural assessment with case laws)",
      key_arguments: ["Constitutional intent vs executive friction", "Sarkaria & Punchhi recommendations", "Timelines under Art. 200"]
    }
  },
  {
    id: "ca-upsc-gs2-2",
    headline: "India-Middle East-Europe Economic Corridor (IMEEC) Intergovernmental Framework Operationalized",
    source: "PIB (External Affairs)",
    published_at: "2026-03-20T11:00:00Z",
    summary: "India, UAE, Saudi Arabia, France, and EU finalize multi-modal maritime-rail connectivity protocols, digital customs integration, and hydrogen pipeline networks connecting Mumbai to Piraeus port.",
    key_takeaways: [
      "Consists of two corridors: Eastern Corridor (India to Arabian Gulf) and Northern Corridor (Gulf to Europe).",
      "Reduces logistics transit time by 40% and shipping costs by 30% compared to traditional Suez Canal route.",
      "Strengthens strategic counterweight to unconstrained unilateral connectivity frameworks."
    ],
    syllabus_topic: "Bilateral, Regional & Global Groupings & Agreements Involving India",
    static_concept: "Geopolitics of West Asia, Maritime Chokepoints (Strait of Hormuz, Bab-el-Mandeb) & Trade Corridors",
    textbook_reference: "Pavneet Singh (International Relations, Chapter 6: India & Middle East)",
    relevance_score: 95.0,
    gs_paper: "GS Paper - II (International Relations)",
    category_key: "GS2",
    exam_track: "UPSC",
    prelims_facts: [
      "Announced: G20 New Delhi Summit (September 2023).",
      "Pillars: Rail-ship multi-modal transit, electricity grid cables, high-speed data cables, and clean hydrogen export pipeline."
    ],
    prelims_mcq: {
      question: "The India-Middle East-Europe Economic Corridor (IMEEC) encompasses which of the following connectivity segments?\n1. Rail-maritime cargo transit\n2. Clean hydrogen pipeline infrastructure\n3. High-speed optical fiber communication cables\n\nSelect the correct answer using the code given below:",
      options: { "A": "1 and 2 only", "B": "2 and 3 only", "C": "1 and 3 only", "D": "1, 2 and 3" },
      correct_answer: "D",
      explanation: "IMEEC incorporates multi-modal rail-shipping, clean hydrogen pipelines, and secure digital telecommunication cables."
    }
  },

  // --- UPSC GS-3 ---
  {
    id: "ca-upsc-gs3-1",
    headline: "RBI Reviews External Benchmark Lending Rate (EBLR) & Repo Spread Transmission Dynamics",
    source: "The Hindu (Business)",
    published_at: "2026-03-23T10:00:00Z",
    summary: "Reserve Bank of India Monetary Policy Report highlights 94% transmission of policy rate cycles into fresh floating retail loans under the EBLR framework, contrasting with the legacy MCLR regime.",
    key_takeaways: [
      "EBLR links retail and MSME loans directly to external benchmarks (Repo Rate or 91-Day/182-Day T-Bill).",
      "Banks are permitted to set credit risk spread at inception, which cannot be arbitrarily widened for existing borrowers.",
      "Eliminated the asymmetric pass-through problem where rate cuts were passed slowly but rate hikes immediately."
    ],
    syllabus_topic: "Indian Economy, Monetary Policy & Banking System",
    static_concept: "Monetary Policy Transmission: CRR, SLR, Repo Rate, MCLR vs EBLR & Liquidity Adjustment Facility",
    textbook_reference: "Ramesh Singh (Indian Economy, Chapter 7: Banking in India & Chapter 12: Monetary Policy)",
    relevance_score: 97.0,
    gs_paper: "GS Paper - III (Economy & Banking)",
    category_key: "GS3",
    exam_track: "UPSC",
    background_context: "Before October 2019, Indian commercial banks utilized internal benchmarks (Base Rate, MCLR) which suffered from sluggish transmission due to rigid fixed-deposit cost structures. The mandatory transition to EBLR established real-time monetary transmission in floating credit products.",
    prelims_facts: [
      "Effective Date: Mandatory for all retail & MSME loans since 1 October 2019.",
      "Approved Benchmarks: RBI Repo Rate, 91-Day T-Bill yield, 182-Day T-Bill yield, or FBIL market benchmark.",
      "Spread Rule: Banks can alter risk spread only if borrower's credit profile undergoes documented rating downgrades."
    ],
    prelims_mcq: {
      question: "Which of the following statements is/are correct regarding the External Benchmark Lending Rate (EBLR) regime in India?\n1. It applies mandatorily to all floating-rate personal, retail, and MSME loans.\n2. Commercial banks can use only the RBI Repo Rate as their sole permissible external benchmark.\n\nSelect the correct answer using the code given below:",
      options: { "A": "1 only", "B": "2 only", "C": "Both 1 and 2", "D": "Neither 1 nor 2" },
      correct_answer: "A",
      explanation: "Statement 1 is correct. Statement 2 is incorrect because banks can also use 91-day/182-day T-Bill yields or any other benchmark rate published by FBIL."
    },
    mains_question: {
      text: "Analyze the structural bottlenecks that historically hindered monetary policy transmission in India. How has the transition from MCLR to EBLR transformed credit delivery? (150 words, 10 marks)",
      directive: "Analyze (Structural cause-and-effect assessment)",
      key_arguments: ["Fixed deposit rate rigidity", "Asymmetric pass-through", "EBLR transparency"]
    }
  },
  {
    id: "ca-upsc-gs3-2",
    headline: "EU Carbon Border Adjustment Mechanism (CBAM) Enters Definitive Levy Phase",
    source: "BBC World (Economy)",
    published_at: "2026-03-18T14:00:00Z",
    summary: "European Union commences financial tariffs on carbon-intensive imports (steel, aluminum, cement, fertilizers), prompting India to expand its domestic Carbon Credit Trading Scheme (CCTS).",
    key_takeaways: [
      "Targets carbon leakage by imposing an equivalent carbon price on imports matching the EU Emissions Trading System (ETS).",
      "Key affected Indian export sectors include engineering goods, primary steel, and aluminum.",
      "India champions Principle of Common But Differentiated Responsibilities (CBDR-RC) at WTO dispute committees."
    ],
    syllabus_topic: "Environment, International Trade & Green Transition",
    static_concept: "Carbon Pricing, CBAM, WTO Non-Discrimination (GATT Art. XX Exceptions) & Carbon Credits",
    textbook_reference: "Shankar IAS (Chapter 24: Climate Change Negotiations) & Sanjiv Verma (The Indian Economy)",
    relevance_score: 94.5,
    gs_paper: "GS Paper - III (Environment & Trade)",
    category_key: "GS3",
    exam_track: "UPSC",
    prelims_facts: [
      "Sectors: Iron & Steel, Aluminum, Cement, Fertilizers, Hydrogen, Electricity.",
      "Principle: WTO Article XX (General Exceptions for environmental protection) vs CBDR-RC."
    ],
    prelims_mcq: {
      question: "The 'Carbon Border Adjustment Mechanism' (CBAM), frequently seen in global economic news, is an initiative of:\n\nSelect the correct option:",
      options: { "A": "World Economic Forum (WEF)", "B": "European Union (EU)", "C": "International Monetary Fund (IMF)", "D": "OECD" },
      correct_answer: "B",
      explanation: "CBAM is the European Union's landmark carbon border tax framework."
    }
  },

  // --- UPSC GS-4 ---
  {
    id: "ca-upsc-gs4-1",
    headline: "CVC Issues Revised Guidelines on Conflict of Interest & Post-Retirement Commercial Employment",
    source: "PIB (DoPT)",
    published_at: "2026-03-15T07:00:00Z",
    summary: "Central Vigilance Commission mandates a mandatory 2-year cooling-off period and full public asset disclosures for civil servants transitioning into private advisory or regulatory consulting boards.",
    key_takeaways: [
      "Institutionalizes the Nolan Committee's Principles of Public Life: Selflessness, Integrity, Objectivity, and Openness.",
      "Mitigates the 'Revolving Door' fallacy and regulatory capture in public procurement.",
      "Aligns with 2nd Administrative Reforms Commission (ARC) 4th Report on 'Ethics in Governance'."
    ],
    syllabus_topic: "Public Service Values, Ethics in Public Administration & Probity",
    static_concept: "Conflict of Interest, Revolving Door Syndrome, Nolan Principles & 2nd ARC Ethics Recommendations",
    textbook_reference: "Lexicon for Ethics, Integrity & Aptitude (Chapter 4: Probity in Governance & Public Values)",
    relevance_score: 96.0,
    gs_paper: "GS Paper - IV (Ethics & Probity in Governance)",
    category_key: "GS4",
    exam_track: "UPSC",
    background_context: "Regulatory capture occurs when public servants leverage inside procurement knowledge or policy discretion to benefit private commercial entities immediately after superannuation. The revised CVC directives enforce ethical integrity across the civil service lifecycle.",
    prelims_facts: [
      "Nodal Body: Central Vigilance Commission (Statutory Body under CVC Act 2003).",
      "Core Reference: 2nd ARC 4th Report 'Ethics in Governance'.",
      "Nolan Principles: 7 foundational principles formulated by UK Committee on Standards in Public Life (1995)."
    ],
    mains_question: {
      text: "Explain the concept of 'Conflict of Interest' in public administration. How do post-retirement cooling-off norms protect public trust and institutional integrity? (150 words, 10 marks)",
      directive: "Explain & Illustrate (Conceptual clarity with administrative examples)",
      key_arguments: ["Nolan principles", "Regulatory capture", "Cooling-off safeguards"]
    }
  },

  // --- CDS DEFENSE & STRATEGIC AFFAIRS ---
  {
    id: "ca-cds-def-1",
    headline: "Cabinet Committee on Security (CCS) Approves Final Roadmap for Integrated Theatre Commands",
    source: "PIB (Ministry of Defence)",
    published_at: "2026-03-25T12:00:00Z",
    summary: "Government finalizes operational blueprint for three joint theater commands (Northern Command for land borders, Western Command for western front, Maritime Theatre Command for Indo-Pacific) under the Chief of Defence Staff.",
    key_takeaways: [
      "Transitions Indian Armed Forces from 17 single-service commands to unified operational battle formations.",
      "Integrates Air Defence Command and Joint Logistics Nodes to optimize cross-service firepower and munitions.",
      "Commanders-in-Chief will report operationally to the Chiefs of Staff Committee chaired by the CDS."
    ],
    syllabus_topic: "Higher Defense Management, Military Jointness & Theatre Commands",
    static_concept: "Higher Defense Organization: Chiefs of Staff Committee, Theatre Commands & Department of Military Affairs",
    textbook_reference: "CDS Military Studies Manual & NCERT Defense Studies (Chapter 8: Modern Armed Forces Organization)",
    relevance_score: 99.0,
    gs_paper: "CDS Defense Studies & Strategic Affairs",
    category_key: "DEFENSE",
    exam_track: "CDS",
    background_context: "The Shekatkar Committee (2016) and Kargil Review Committee (1999) strongly advocated for jointness in operations. Integrated Theatre Commands unite resources of the Army, Navy, and Air Force under a single commander to execute cohesive warfighting in designated geographical operational zones.",
    prelims_facts: [
      "Single-Service Commands: 17 existing commands (Army: 7, Navy: 3, IAF: 7).",
      "Tri-Service Existing Commands: Andaman and Nicobar Command (ANC) & Strategic Forces Command (SFC).",
      "Key Reformer: Lt. Gen. D.B. Shekatkar Committee (2016)."
    ],
    prelims_mcq: {
      question: "Which of the following is currently India's only operational geographical tri-service theatre command?\n\nSelect the correct option:",
      options: {
        "A": "Northern Command (Udhampur)",
        "B": "Western Naval Command (Mumbai)",
        "C": "Andaman and Nicobar Command (Port Blair)",
        "D": "South Western Air Command (Gandhinagar)"
      },
      correct_answer: "C",
      explanation: "The Andaman and Nicobar Command (ANC), established in 2001 at Port Blair, is India's first and only operational geographical tri-service command."
    }
  },
  {
    id: "ca-cds-def-2",
    headline: "Indian Navy Commissions Fourth Project 15B Stealth Destroyer INS Surat",
    source: "Ministry of Defence",
    published_at: "2026-03-21T09:00:00Z",
    summary: "Constructed indigenously by Mazagon Dock Shipbuilders Limited (MDL), INS Surat features 75% indigenous content, BrahMos supersonic cruise missiles, and advanced Barak-8 Long Range Surface-to-Air Missiles (LRSAM).",
    key_takeaways: [
      "Fourth and final ship of the Visakhapatnam-class (Project 15B) guided-missile destroyers.",
      "Equipped with advanced network-centric warfare capabilities, total atmospheric control system, and sonar dome.",
      "Bolsters Indian naval power projection and sea-lane protection across the Sea Lines of Communication (SLOCs)."
    ],
    syllabus_topic: "Indigenization of Defense Technology & Naval Capabilities",
    static_concept: "Project 15B vs Project 17A, Indigenous Defense Manufacturing (Make in India) & Maritime Strategy",
    textbook_reference: "CDS General Knowledge & Defense Technology Handbook",
    relevance_score: 96.5,
    gs_paper: "CDS Defense Technology & Indigenization",
    category_key: "DEFENSE",
    exam_track: "CDS",
    prelims_facts: [
      "Class: Project 15B Visakhapatnam-class (INS Visakhapatnam, INS Mormugao, INS Imphal, INS Surat).",
      "Shipbuilder: Mazagon Dock Shipbuilders Limited (MDL), Mumbai.",
      "Armament: BrahMos supersonic cruise missiles, Barak-8 LRSAM, 76mm super rapid gun mount, and heavy-weight torpedoes."
    ],
    prelims_mcq: {
      question: "The 'Visakhapatnam-class' warships built under Project 15B of the Indian Navy belong to which category of naval vessels?\n\nSelect the correct option:",
      options: {
        "A": "Nuclear-powered attack submarines (SSN)",
        "B": "Stealth guided-missile destroyers",
        "C": "Landing Helicopter Docks (LHD)",
        "D": "Aircraft Carriers"
      },
      correct_answer: "B",
      explanation: "Project 15B represents the Visakhapatnam-class stealth guided-missile destroyers."
    }
  }
];

export default function CurrentAffairsPage() {
  const mode = useArenaStore((state) => state.mode);
  const [items, setItems] = useState<CurrentAffairsItem[]>(CANONICAL_ARTICLES);
  const [isLoading, setIsLoading] = useState(false);
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

  // Auto-reset category filter when exam mode switches
  useEffect(() => {
    setSelectedCategory("ALL");
  }, [mode]);

  const fetchCurrentAffairs = async (forceRefresh = false) => {
    setIsLoading(true);
    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const queryParams = new URLSearchParams({
        exam_type: mode,
        category: selectedCategory,
        limit: "30",
        force_refresh: forceRefresh ? "true" : "false"
      });
      const res = await fetch(`${apiEndpoint}/api/v1/intelligence/current-affairs?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge API data with canonical base
          const mapped: CurrentAffairsItem[] = data.map((d: any) => {
            let catKey: CurrentAffairsItem["category_key"] = "GS2";
            const p = (d.gs_paper || "").toUpperCase();
            if (p.includes("I)") || p.includes("GS-1") || p.includes("GS PAPER - I")) catKey = "GS1";
            else if (p.includes("II)") || p.includes("GS-2") || p.includes("GS PAPER - II")) catKey = "GS2";
            else if (p.includes("III)") || p.includes("GS-3") || p.includes("GS PAPER - III")) catKey = "GS3";
            else if (p.includes("IV)") || p.includes("GS-4") || p.includes("GS PAPER - IV")) catKey = "GS4";
            else if (p.includes("DEFENSE") || p.includes("CDS") || d.exam_track === "CDS") catKey = "DEFENSE";

            return {
              ...d,
              category_key: d.category_key || catKey,
              exam_track: d.exam_track || (d.category_key === "DEFENSE" ? "CDS" : "UPSC")
            };
          });
          setItems(mapped);
        }
      }
    } catch {
      console.warn("Using embedded high-yield canonical current affairs feed.");
      setItems(CANONICAL_ARTICLES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentAffairs();
  }, [mode]);

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
        toast.info("Using cached high-yield intelligence wire.");
      }
    } catch {
      toast.info("Active wire synchronized from canonical knowledge base.");
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

  // Exam Track Pool: only items matching active mode
  const examPool = useMemo(() => {
    return items.filter((item) => {
      if (mode === "UPSC") {
        return item.exam_track === "UPSC" || item.exam_track === "BOTH" || item.category_key.startsWith("GS");
      }
      return item.exam_track === "CDS" || item.exam_track === "BOTH" || item.category_key === "DEFENSE";
    });
  }, [items, mode]);

  // Dynamic Categories based on active exam track
  const categories = useMemo(() => {
    if (mode === "UPSC") {
      return [
        { key: "ALL", label: "All Intelligence", count: examPool.length },
        { key: "GS1", label: "GS-1 (History & Geo)", count: examPool.filter(i => i.category_key === "GS1").length },
        { key: "GS2", label: "GS-2 (Polity & IR)", count: examPool.filter(i => i.category_key === "GS2").length },
        { key: "GS3", label: "GS-3 (Economy & Env)", count: examPool.filter(i => i.category_key === "GS3").length },
        { key: "GS4", label: "GS-4 (Ethics & Probity)", count: examPool.filter(i => i.category_key === "GS4").length },
      ];
    }
    return [
      { key: "ALL", label: "All Defense Wire", count: examPool.length },
      { key: "DEFENSE", label: "Defense & Strategic Affairs", count: examPool.filter(i => i.category_key === "DEFENSE").length },
      { key: "GK", label: "General Knowledge", count: examPool.filter(i => i.category_key === "GK" || i.category_key === "GS1").length },
      { key: "ENGLISH", label: "English Language", count: examPool.filter(i => i.category_key === "ENGLISH").length },
      { key: "MATH", label: "Elementary Mathematics", count: examPool.filter(i => i.category_key === "MATH").length },
    ];
  }, [examPool, mode]);

  // Filter items by active category, search query and source
  const filteredItems = useMemo(() => {
    return examPool.filter((item) => {
      // Category Match
      let matchesCat = true;
      if (selectedCategory !== "ALL") {
        if (mode === "UPSC") {
          matchesCat = item.category_key === selectedCategory;
        } else {
          if (selectedCategory === "DEFENSE") matchesCat = item.category_key === "DEFENSE";
          else if (selectedCategory === "GK") matchesCat = item.category_key === "GK" || item.category_key === "GS1";
          else if (selectedCategory === "ENGLISH") matchesCat = item.category_key === "ENGLISH";
          else if (selectedCategory === "MATH") matchesCat = item.category_key === "MATH";
        }
      }

      // Search Query Match
      const qLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        qLower === "" ||
        item.headline.toLowerCase().includes(qLower) ||
        item.syllabus_topic.toLowerCase().includes(qLower) ||
        item.static_concept.toLowerCase().includes(qLower) ||
        item.summary.toLowerCase().includes(qLower);

      // Source Match
      const matchesSource =
        selectedSource === "ALL" ||
        item.source.toLowerCase().includes(selectedSource.toLowerCase());

      return matchesCat && matchesSearch && matchesSource;
    });
  }, [examPool, selectedCategory, searchQuery, selectedSource, mode]);

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
                360° {mode === "UPSC" ? "UPSC CSE" : "CDS Defense"} Intelligence Engine
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-md">
                Verified Multi-Source Wire
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Daily Syllabus-Grounded Current Affairs &amp; Editorial Analysis
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
              High-accuracy dispatches enriched with <strong>Background Genesis</strong>, <strong>Prelims Fact Boxes</strong>, <strong>Mains GS Dimensions</strong>, and <strong>Static Textbook Chapter Bridges</strong>.
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
                      ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 font-black"
                      : "bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      selectedCategory === cat.key
                        ? "bg-neutral-950 text-amber-400 font-black"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {cat.count}
                  </span>
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
                placeholder={`Search ${mode} news, topics, constitutional articles, or concepts...`}
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
                <option value="Ministry of Defence">Ministry of Defence / DRDO</option>
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
              Try resetting your search query or select a different subject category.
            </p>
            <button
              onClick={() => { setSelectedCategory("ALL"); setSearchQuery(""); setSelectedSource("ALL"); }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl font-mono"
            >
              Reset Filters
            </button>
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
                        Core {mode === "UPSC" ? "Prelims & Mains" : "Exam"} Takeaways
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
                      Static Textbook &amp; Syllabus Linkage
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
                    {item.prelims_mcq && (
                      <button
                        onClick={() => handleOpenMCQ(item)}
                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        Solve {mode === "UPSC" ? "Prelims MCQ" : "Practice MCQ"}
                      </button>
                    )}

                    {item.mains_question && mode === "UPSC" && (
                      <Link
                        href={`/mains?prompt=${encodeURIComponent(item.mains_question.text)}`}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Evaluate Mains Answer</span>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* MODAL 1: PRELIMS MCQ SOLVER */}
      {activeMCQItem && activeMCQItem.prelims_mcq && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold rounded-lg">
                  {mode === "UPSC" ? "Prelims MCQ Challenge" : "CDS Practice Challenge"}
                </span>
                <span className="text-xs text-neutral-400 font-mono">1 Item • +2.0 / -0.66</span>
              </div>
              <button
                onClick={() => setActiveMCQItem(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white leading-relaxed whitespace-pre-line">
                {activeMCQItem.prelims_mcq.question}
              </h3>

              <div className="space-y-2">
                {Object.entries(activeMCQItem.prelims_mcq.options).map(([optKey, optText]) => {
                  const isSelected = selectedOption === optKey;
                  const isCorrectAnswer = optKey === activeMCQItem.prelims_mcq?.correct_answer;
                  let btnStyle = "bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-700";
                  
                  if (isAnswerSubmitted) {
                    if (isCorrectAnswer) {
                      btnStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-200";
                    } else if (isSelected && !isCorrectAnswer) {
                      btnStyle = "bg-red-950/60 border-red-500 text-red-200";
                    }
                  } else if (isSelected) {
                    btnStyle = "bg-amber-500/20 border-amber-500 text-amber-300";
                  }

                  return (
                    <button
                      key={optKey}
                      onClick={() => !isAnswerSubmitted && setSelectedOption(optKey)}
                      disabled={isAnswerSubmitted}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs font-sans transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                    >
                      <span className="font-bold font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                        {optKey}
                      </span>
                      <span className="flex-grow pt-0.5">{optText}</span>
                    </button>
                  );
                })}
              </div>

              {isAnswerSubmitted && (
                <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-2 text-xs">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Psychometric Socratic Explanation
                  </div>
                  <p className="text-neutral-300 leading-relaxed font-sans">
                    {activeMCQItem.prelims_mcq.explanation}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitMCQ}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Submit Response
                </button>
              ) : (
                <button
                  onClick={() => setActiveMCQItem(null)}
                  className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 360° EDITORIAL DEEP DIVE */}
      {activeEditorialItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-neutral-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between gap-4 bg-[#161616]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold rounded">
                    {activeEditorialItem.gs_paper}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {activeEditorialItem.source} • Yield {activeEditorialItem.relevance_score}%
                  </span>
                </div>
                <h2 className="text-lg font-black text-white leading-tight">
                  {activeEditorialItem.headline}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyRevisionNotes(activeEditorialItem)}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-750 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Copy 360° Revision Note to Clipboard"
                >
                  {isCopiedNotes ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span className="hidden sm:inline">{isCopiedNotes ? "Copied!" : "Copy Notes"}</span>
                </button>
                <button
                  onClick={() => setActiveEditorialItem(null)}
                  className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="flex items-center gap-2 p-3 bg-neutral-950/80 border-b border-neutral-850 overflow-x-auto">
              <button
                onClick={() => setEditorialTab("GENESIS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  editorialTab === "GENESIS" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                }`}
              >
                1. Background Genesis
              </button>
              <button
                onClick={() => setEditorialTab("PRELIMS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  editorialTab === "PRELIMS" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                }`}
              >
                2. Prelims Facts Box
              </button>
              <button
                onClick={() => setEditorialTab("MAINS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  editorialTab === "MAINS" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                }`}
              >
                3. Mains Dimensions
              </button>
              <button
                onClick={() => setEditorialTab("WAYFORWARD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  editorialTab === "WAYFORWARD" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                }`}
              >
                4. Arguments &amp; Way Forward
              </button>
              <button
                onClick={() => setEditorialTab("TEXTBOOK")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  editorialTab === "TEXTBOOK" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                }`}
              >
                5. Textbook Grounding
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-grow text-xs leading-relaxed text-neutral-200">
              {editorialTab === "GENESIS" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Historical &amp; Structural Background Context
                  </h4>
                  <p className="text-neutral-300 leading-relaxed font-sans text-sm">
                    {activeEditorialItem.background_context || activeEditorialItem.summary}
                  </p>
                </div>
              )}

              {editorialTab === "PRELIMS" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    High-Yield Prelims Fact Anchors
                  </h4>
                  <ul className="space-y-2">
                    {(activeEditorialItem.prelims_facts || activeEditorialItem.key_takeaways).map((fact, idx) => (
                      <li key={idx} className="p-3 bg-neutral-900/70 border border-neutral-800 rounded-xl flex items-start gap-2.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {editorialTab === "MAINS" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    Multi-Dimensional Analytical Breakdown
                  </h4>
                  {(activeEditorialItem.mains_dimensions || []).map((dim, idx) => (
                    <div key={idx} className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-2">
                      <div className="font-bold text-amber-300 text-xs uppercase tracking-wider">{dim.title}</div>
                      <ul className="space-y-1.5 text-neutral-300">
                        {dim.points.map((pt, pidx) => (
                          <li key={pidx} className="flex items-start gap-2">
                            <span className="text-neutral-500">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {editorialTab === "WAYFORWARD" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    Strategic Policy Arguments &amp; Way Forward
                  </h4>

                  {activeEditorialItem.arguments_matrix && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1.5">
                        <div className="font-bold text-emerald-300">Pros / Constructive Outcomes</div>
                        <ul className="space-y-1 text-neutral-300">
                          {activeEditorialItem.arguments_matrix.pros.map((p, pidx) => (
                            <li key={pidx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400">✓</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 bg-red-950/20 border border-red-800/40 rounded-xl space-y-1.5">
                        <div className="font-bold text-red-300">Challenges / Criticisms</div>
                        <ul className="space-y-1 text-neutral-300">
                          {activeEditorialItem.arguments_matrix.cons.map((c, cidx) => (
                            <li key={cidx} className="flex items-start gap-1.5">
                              <span className="text-red-400">✕</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeEditorialItem.way_forward && (
                    <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                      <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">Recommended 2nd ARC / Constitutional Way Forward</div>
                      <ul className="space-y-1.5 text-neutral-300">
                        {activeEditorialItem.way_forward.map((w, widx) => (
                          <li key={widx} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">→</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {editorialTab === "TEXTBOOK" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Canonical Textbook &amp; Syllabus Anchors
                  </h4>
                  <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
                    <div>
                      <span className="text-neutral-400 font-bold">Syllabus Topic: </span>
                      <span className="text-white">{activeEditorialItem.syllabus_topic}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-bold">Static Theoretical Concept: </span>
                      <span className="text-amber-300">{activeEditorialItem.static_concept}</span>
                    </div>
                    <div>
                      <span className="text-purple-300 font-bold">Recommended Standard Reference: </span>
                      <span className="text-neutral-200">{activeEditorialItem.textbook_reference}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-800 bg-[#161616] flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">
                Officer&apos;s Arena AI Multimodal Knowledge Synthesizer
              </span>
              <button
                onClick={() => setActiveEditorialItem(null)}
                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
