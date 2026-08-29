"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Zap 
} from "lucide-react";

export default function CommandControlLandingPage() {
  const heroTitle = "The Mind of the Examiner, Modeled for You.";
  const words = heroTitle.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2
      }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans relative overflow-hidden select-none">
      {/* Linear Ambient Background Blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-600/10 via-amber-500/5 to-transparent blur-[160px] pointer-events-none" />

      {/* Navigation Bar */}
      <header className="p-6 border-b border-neutral-900/80 flex items-center justify-between max-w-6xl w-full mx-auto z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg">
            <BrainCircuit className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-sm font-black tracking-widest uppercase text-white">Officers Arena</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="text-xs font-bold text-neutral-400 hover:text-white transition-all uppercase tracking-wider"
          >
            Sign In
          </Link>
          <Link
            href="/arena"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 text-xs font-extrabold uppercase rounded-xl transition-all shadow-lg flex items-center gap-1.5"
            style={{ boxShadow: "0 0 20px var(--accent-glow, rgba(217,119,6,0.3))" }}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Launch Arena
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center flex flex-col items-center gap-8 z-10 my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-bold text-amber-400 uppercase tracking-widest"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Precision Cognitive Exam Preparation
        </motion.div>

        {/* Staggered Word Reveal */}
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] max-w-3xl"
        >
          {words.map((word, index) => (
            <motion.span
              key={index}
              variants={wordVariants}
              className={`inline-block mr-3 ${
                word.includes("Examiner,") || word.includes("You.")
                  ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent"
                  : "text-white"
              }`}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-sm md:text-base text-neutral-400 max-w-xl leading-relaxed font-normal"
        >
          Precision prep for UPSC and CDS powered by Cognitive Digital Twins. Real-time BKT knowledge mapping and 3PL IRT difficulty calibration.
        </motion.p>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-4"
        >
          <Link
            href="/arena"
            className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-2xl flex items-center gap-3 cursor-pointer"
            style={{ boxShadow: "0 0 30px var(--accent-glow, rgba(217,119,6,0.4))" }}
          >
            Start Preparing for Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </main>

      {/* Bento Grid Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 z-10 w-full">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Neural Command Matrix</span>
          <h2 className="text-2xl md:text-3xl font-black text-white mt-1">Grounded Systems Architecture</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Exam Intelligence */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="bg-[#111111] border border-neutral-800 hover:border-amber-500/40 p-8 rounded-3xl flex flex-col justify-between gap-8 relative overflow-hidden group shadow-xl"
          >
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-fit">
              <TrendingUp className="w-6 h-6 text-amber-500" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Module 1</span>
              <h3 className="text-xl font-black text-white mt-1">Exam Intelligence</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                15 years of paper patterns decoded using Poisson rotation models to predict high-yield exam syllabus weightage.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-850 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
              <span>Poisson Rotation</span>
              <span className="text-amber-500 font-mono">15-Yr Trends</span>
            </div>
          </motion.div>

          {/* Card 2: Student Intelligence */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="bg-[#111111] border border-neutral-800 hover:border-amber-500/40 p-8 rounded-3xl flex flex-col justify-between gap-8 relative overflow-hidden group shadow-xl"
          >
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-fit">
              <Cpu className="w-6 h-6 text-amber-500" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Module 2</span>
              <h3 className="text-xl font-black text-white mt-1">Student Intelligence</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Your cognitive digital twin maps every weak point in real-time using Bayesian Knowledge Tracing (BKT).
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-850 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
              <span>IRT 3PL EAP</span>
              <span className="text-amber-500 font-mono">BKT Twin</span>
            </div>
          </motion.div>

          {/* Card 3: Socratic AI */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="bg-[#111111] border border-neutral-800 hover:border-amber-500/40 p-8 rounded-3xl flex flex-col justify-between gap-8 relative overflow-hidden group shadow-xl"
          >
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-fit">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Module 3</span>
              <h3 className="text-xl font-black text-white mt-1">Socratic AI</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Zero-hallucination tutoring grounded strictly in official textbooks, Laxmikanth, and NCERT sources via GraphRAG.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-850 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
              <span>GraphRAG CTE</span>
              <span className="text-amber-500 font-mono">Verified Sources</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 border-t border-neutral-900 text-center text-[10px] text-neutral-500 font-semibold mt-auto z-10">
        Officers Arena Platform • Linear Intelligence Architecture
      </footer>
    </div>
  );
}
