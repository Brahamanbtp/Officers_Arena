"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Globe,
  Search,
  HelpCircle,
  Settings,
  User,
  LogOut,
  LogIn,
  Zap,
  Flame,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useArenaStore } from "@/src/store/useArenaStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { HelpFeedbackModal } from "./HelpFeedbackModal";
import { CommandPalette } from "./CommandPalette";
import { toast } from "sonner";

export const AppHeader: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const mode = useArenaStore((state) => state.mode);
  const setMode = useArenaStore((state) => state.setMode);
  const setAuthExamMode = useAuthStore((state) => state.setExamMode);
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const logout = useAuthStore((state) => state.logout);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showExamDropdown, setShowExamDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const applyThemeToDOM = (selectedTheme: "dark" | "light") => {
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      if (selectedTheme === "light") {
        html.classList.remove("dark");
        html.classList.add("light");
        html.style.colorScheme = "light";
      } else {
        html.classList.remove("light");
        html.classList.add("dark");
        html.style.colorScheme = "dark";
      }
    }
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem("officers_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    applyThemeToDOM(savedTheme);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowExamDropdown(false);
    setShowUserDropdown(false);
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
    { label: mode === "UPSC" ? "Prelims Arena" : "CDS Arena", href: "/arena", icon: Activity, active: pathname === "/arena" },
    ...(mode === "UPSC" ? [{ label: "Mains AES", href: "/mains", icon: PenTool, active: pathname === "/mains", badge: "OCR" }] : []),
    { label: "Current Affairs", href: "/current-affairs", icon: Globe, active: pathname === "/current-affairs", badge: "360°" },
    { label: "Strategist", href: "/strategist", icon: Sparkles, active: pathname === "/strategist" },
    { label: "PYQ Vault", href: "/library", icon: BookOpen, active: pathname === "/library" },
  ];

  const handleSwitchExam = (newMode: "UPSC" | "CDS") => {
    setMode(newMode);
    setAuthExamMode(newMode);
    setShowExamDropdown(false);
    toast.success(`Switched to ${newMode === "UPSC" ? "UPSC Civil Services" : "CDS Combined Defence Services"} Track!`, {
      description: "Syllabus taxonomy, test timers, and scoring algorithms updated."
    });
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    toast.info("Logged out of Cadet Session", {
      description: "Switched to local guest exploration mode."
    });
    router.push("/");
  };

  const userName = user?.full_name || (isGuest ? "Guest Cadet" : "Cadet Officer");

  return (
    <>
      <header className={`border-b sticky top-0 backdrop-blur-2xl z-40 transition-colors shadow-lg ${
        isLight ? "bg-white/95 border-neutral-200 text-neutral-900" : "bg-[#0a0a0a]/90 border-neutral-850 text-neutral-100"
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* Logo & Brand Cluster */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-all">
              <BrainCircuit className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-black tracking-wider uppercase leading-none font-mono ${isLight ? "text-neutral-950" : "text-white"}`}>
                  Officers Arena
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  v2.6
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-semibold tracking-wider uppercase mt-0.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{mode} Adaptive Intelligence</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className={`hidden lg:flex items-center p-1 rounded-2xl border transition-all ${
            isLight ? "bg-neutral-100 border-neutral-200" : "bg-neutral-950/80 border-neutral-800"
          }`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                    item.active 
                      ? "bg-amber-500 text-neutral-950 shadow-md font-black" 
                      : `${isLight ? "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60" : "text-neutral-400 hover:text-white hover:bg-neutral-900"}`
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.active ? "text-neutral-950" : "text-neutral-400"}`} />
                  <span>{item.label}</span>
                  {item.badge && !item.active && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[8px] font-mono font-black uppercase rounded bg-neutral-850 text-amber-300 border border-neutral-750">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Cluster: Quick Search, Target Switcher, Help, User Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Quick Command Bar Trigger (Cmd+K) */}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200 border border-neutral-800 rounded-xl text-xs font-mono transition-all cursor-pointer"
              title="Search modules, books, and commands (Ctrl+K / ⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Search...</span>
              <kbd className="px-1.5 py-0.5 bg-neutral-950 text-neutral-400 border border-neutral-800 rounded text-[9px] font-black">
                ⌘K
              </kbd>
            </button>

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

              {/* Exam Dropdown Menu */}
              {showExamDropdown && (
                <div className={`absolute right-0 mt-2 w-56 rounded-2xl p-2 shadow-2xl z-50 space-y-1 border animate-in fade-in duration-150 ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#141414] border-neutral-800"
                }`}>
                  <button
                    type="button"
                    onClick={() => handleSwitchExam("UPSC")}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                      mode === "UPSC"
                        ? "bg-amber-500/20 text-amber-300 font-black border border-amber-500/30"
                        : "hover:bg-neutral-900 text-neutral-300"
                    }`}
                  >
                    <div>
                      <div className="font-bold">UPSC Civil Services</div>
                      <div className="text-[10px] text-neutral-400 font-mono">Prelims GS-1 + Mains AES</div>
                    </div>
                    {mode === "UPSC" && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchExam("CDS")}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                      mode === "CDS"
                        ? "bg-blue-500/20 text-blue-300 font-black border border-blue-500/30"
                        : "hover:bg-neutral-900 text-neutral-300"
                    }`}
                  >
                    <div>
                      <div className="font-bold">Combined Defence Services</div>
                      <div className="text-[10px] text-neutral-400 font-mono">IMA, INA, AFA & OTA</div>
                    </div>
                    {mode === "CDS" && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Help & Support Trigger */}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isLight 
                  ? "bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200" 
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
              title="Academic Support & Help"
            >
              <HelpCircle className="w-4 h-4 text-purple-400" />
            </button>

            {/* Theme Toggle (Dark / Light) */}
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

            {/* User Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-xs text-neutral-950 font-mono">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-bold text-white leading-tight truncate max-w-[90px]">{userName}</div>
                  <div className="text-[10px] text-amber-400 font-mono leading-none">{isGuest ? "Guest" : "Cadet"}</div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${showUserDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <div className={`absolute right-0 mt-2 w-60 rounded-2xl p-2.5 shadow-2xl z-50 space-y-1.5 border animate-in fade-in duration-150 ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#141414] border-neutral-800"
                }`}>
                  <div className="p-3 bg-neutral-900/60 rounded-xl space-y-1 border border-neutral-850">
                    <div className="font-bold text-xs text-white">{userName}</div>
                    <div className="text-[11px] text-neutral-400 font-mono truncate">{user?.email || "Guest Cadet Mode"}</div>
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-emerald-400">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>Daily Streak: Active</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(true);
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-900 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>Profile & Settings</span>
                  </button>

                  <Link
                    href="/strategist"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-900 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Cognitive Strategist</span>
                  </Link>

                  <Link
                    href="/growth"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-900 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Growth & Accuracy</span>
                  </Link>

                  <div className="pt-1 border-t border-neutral-800">
                    {isGuest ? (
                      <div className="space-y-1 pt-1">
                        <Link
                          href="/login"
                          onClick={() => setShowUserDropdown(false)}
                          className="w-full text-center py-2 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Sign In / Sign Up</span>
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                mobileMenuOpen
                  ? "bg-amber-500 text-neutral-950 border-amber-500"
                  : `${isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-neutral-200"}`
              }`}
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`lg:hidden border-b overflow-hidden ${
                isLight ? "bg-white/95 border-neutral-200" : "bg-neutral-950/95 border-neutral-800"
              }`}
            >
              <div className="px-4 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.active;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? "bg-amber-500 text-neutral-950 shadow-md font-black"
                            : "bg-neutral-900 text-neutral-300 hover:bg-neutral-850 hover:text-white border border-neutral-800"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-neutral-850 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400">Exam Target</span>
                  <div className="flex items-center gap-1.5">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Global Modals */}
      <ProfileSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <HelpFeedbackModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
      />
    </>
  );
};

export default AppHeader;
