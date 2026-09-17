"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BrainCircuit, 
  Activity, 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  Moon, 
  Sun, 
  ChevronDown, 
  PenTool, 
  Menu, 
  X,
  Compass,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useArenaStore } from "@/src/store/useArenaStore";
import { useAuthStore } from "@/src/store/useAuthStore";

export const AppHeader: React.FC = () => {
  const pathname = usePathname();
  const mode = useArenaStore((state) => state.mode);
  const setMode = useArenaStore((state) => state.setMode);
  const setAuthExamMode = useAuthStore((state) => state.setExamMode);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showExamDropdown, setShowExamDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const applyThemeToDOM = (selectedTheme: "dark" | "light") => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (selectedTheme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
      }
    }
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem("officers_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    applyThemeToDOM(savedTheme);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowExamDropdown(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("officers_theme", nextTheme);
    applyThemeToDOM(nextTheme);
  };

  const isLight = theme === "light";

  const navItems = [
    { label: "Daily Mission", href: "/", icon: Activity, active: pathname === "/", badge: "Today" },
    { label: "Prelims Arena", href: "/arena", icon: Activity, active: pathname === "/arena" },
    { label: "Mains AES", href: "/mains", icon: PenTool, active: pathname === "/mains", badge: "OCR" },
    { label: "Strategist", href: "/strategist", icon: Sparkles, active: pathname === "/strategist" },
    { label: "PYQ Vault", href: "/library", icon: BookOpen, active: pathname === "/library" },
  ];

  const handleSwitchExam = (newMode: "UPSC" | "CDS") => {
    setMode(newMode);
    setAuthExamMode(newMode);
    setShowExamDropdown(false);
  };

  return (
    <header className={`border-b sticky top-0 backdrop-blur-xl z-50 transition-colors ${
      isLight ? "bg-white/95 border-neutral-200 text-neutral-900" : "bg-[#0c0c0c]/90 border-neutral-800 text-neutral-100"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl shadow-md group-hover:scale-105 transition-all">
            <BrainCircuit className="w-5 h-5 text-neutral-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className={`text-sm font-black tracking-wider uppercase leading-none ${isLight ? "text-neutral-950" : "text-white"}`}>
                Officers Arena
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                v2.6
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase mt-0.5">
              {mode} Adaptive Suite
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Bar (Visible on lg screens >= 1024px) */}
        <nav className={`hidden lg:flex items-center p-1 rounded-xl border transition-all ${
          isLight ? "bg-neutral-100 border-neutral-200" : "bg-neutral-950/80 border-neutral-800/90"
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                  item.active 
                    ? "bg-amber-600 text-neutral-950 shadow-md font-black" 
                    : `${isLight ? "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60" : "text-neutral-400 hover:text-white hover:bg-neutral-900"}`
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.active ? "text-neutral-950" : "text-neutral-400"}`} />
                <span>{item.label}</span>
                {item.badge && !item.active && (
                  <span className="ml-1 px-1 py-0.2 text-[8px] font-extrabold uppercase rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Cluster: Target Switcher, Theme, Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Active Exam Target Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExamDropdown(!showExamDropdown)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                mode === "UPSC"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:border-amber-500"
                  : "bg-blue-500/10 border-blue-500/40 text-blue-400 hover:border-blue-500"
              }`}
            >
              <span className="text-[11px] font-bold">{mode}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExamDropdown ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {showExamDropdown && (
              <div className={`absolute right-0 mt-2 w-48 rounded-2xl p-2 shadow-2xl z-50 space-y-1 border ${
                isLight ? "bg-white border-neutral-200" : "bg-[#141414] border-neutral-800"
              }`}>
                <button
                  type="button"
                  onClick={() => handleSwitchExam("UPSC")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    mode === "UPSC" 
                      ? "bg-amber-500/20 text-amber-400 font-black" 
                      : `${isLight ? "text-neutral-700 hover:bg-neutral-100" : "text-neutral-300 hover:bg-neutral-900"}`
                  }`}
                >
                  <div>
                    <span className="block font-bold">UPSC CSE</span>
                    <span className="text-[10px] opacity-70">Civil Services Track</span>
                  </div>
                  {mode === "UPSC" && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchExam("CDS")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    mode === "CDS" 
                      ? "bg-blue-500/20 text-blue-400 font-black" 
                      : `${isLight ? "text-neutral-700 hover:bg-neutral-100" : "text-neutral-300 hover:bg-neutral-900"}`
                  }`}
                >
                  <div>
                    <span className="block font-bold">CDS Exam</span>
                    <span className="text-[10px] opacity-70">Defence Forces Track</span>
                  </div>
                  {mode === "CDS" && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isLight 
                ? "bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200" 
                : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white"
            }`}
            title="Toggle Dark / Light Theme"
          >
            {isLight ? <Moon className="w-4 h-4 text-neutral-800" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Mobile Hamburger Button (Visible on < 1024px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              mobileMenuOpen
                ? "bg-amber-600 text-neutral-950 border-amber-600"
                : `${isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-neutral-200"}`
            }`}
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

        </div>

      </div>

      {/* Mobile Slide-Out Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`lg:hidden border-b px-4 py-4 transition-colors ${
              isLight ? "bg-white border-neutral-200 shadow-xl" : "bg-[#0e0e0e] border-neutral-800 shadow-2xl"
            }`}
          >
            <div className="grid grid-cols-2 gap-2 mb-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                      item.active 
                        ? "bg-amber-600 text-neutral-950 font-black border-amber-500 shadow-md" 
                        : `${isLight ? "bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100" : "bg-neutral-900/90 border-neutral-800 text-neutral-200 hover:bg-neutral-850"}`
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.active ? "text-neutral-950" : "text-amber-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Quick Track Switch inside Mobile Drawer */}
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold">Target Track:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSwitchExam("UPSC")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase border cursor-pointer ${
                    mode === "UPSC"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400"
                  }`}
                >
                  UPSC CSE
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchExam("CDS")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase border cursor-pointer ${
                    mode === "CDS"
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400"
                  }`}
                >
                  CDS
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AppHeader;
