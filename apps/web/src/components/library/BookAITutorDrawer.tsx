"use client";

import React, { useState } from "react";
import { Sparkles, Send, Loader2, BookOpen, CheckCircle, HelpCircle, Lightbulb, FileText, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface BookAITutorProps {
  bookId: string;
  bookTitle: string;
  currentPage: number;
  totalPages: number;
  chapterTitle?: string;
}

interface Message {
  id: string;
  sender: "user" | "tutor";
  text: string;
  timestamp: string;
}

export const BookAITutorDrawer: React.FC<BookAITutorProps> = ({
  bookId,
  bookTitle,
  currentPage,
  totalPages,
  chapterTitle,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "tutor",
      text: `👋 **Welcome to your AI Textbook Study Companion!**\n\nI am actively grounded on **Page ${currentPage}** of *${bookTitle}*.\n\nAsk me any concept explanation, request practice MCQs, or click any of the quick-actions below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputPrompt("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/books/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: bookId,
          current_page: currentPage,
          prompt: textToSend,
          action_type: "custom",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const tutorMsg: Message = {
          id: `tutor-${Date.now()}`,
          sender: "tutor",
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, tutorMsg]);
      } else {
        throw new Error("Failed to get AI response");
      }
    } catch (err) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "tutor",
        text: `⚠️ **Unable to connect to AI Tutor API.** Please ensure the backend server is running on port 8000.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />,
      label: "Explain Simply",
      prompt: `Explain the key concepts on Page ${currentPage} in simple, memorable terms with real-world Indian examples.`,
    },
    {
      icon: <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />,
      label: "Generate 2 MCQs",
      prompt: `Generate 2 authentic UPSC/CDS standard practice MCQs with 4 options and detailed solutions based strictly on Page ${currentPage}.`,
    },
    {
      icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
      label: "High-Yield Prelims Points",
      prompt: `What are the exact high-yield factual and conceptual points on Page ${currentPage} that can be asked in UPSC Prelims / CDS?`,
    },
    {
      icon: <FileText className="w-3.5 h-3.5 text-purple-400" />,
      label: "Mains Answer Framework",
      prompt: `Draft a 150-word UPSC Mains structured answer framework (Introduction, 3 Core Dimensions, Conclusion) based on the topic on Page ${currentPage}.`,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800 text-neutral-100 font-sans">
      {/* Active Grounding Header */}
      <div className="p-3.5 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide uppercase text-amber-400">AI Senior Mentor</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">Zero Hallucination</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
              <BookOpen className="w-3 h-3 text-neutral-500" />
              <span>Grounded on: <strong className="text-neutral-200">Page {currentPage} of {totalPages}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="p-2.5 bg-neutral-950/40 border-b border-neutral-800/80 flex gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.prompt)}
            disabled={isLoading}
            className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-md bg-neutral-800/90 hover:bg-neutral-700/90 border border-neutral-700/60 text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {qp.icon}
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-amber-600 text-neutral-950 font-semibold shadow-md"
                  : "bg-neutral-800/90 border border-neutral-700/60 text-neutral-200 shadow-sm"
              }`}
            >
              <div className="prose prose-invert prose-xs max-w-none break-words">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/40 text-neutral-400 text-xs animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>Analyzing Page {currentPage} & generating grounded response...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={`Ask AI Tutor about Page ${currentPage}...`}
            disabled={isLoading}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold disabled:opacity-40 disabled:hover:bg-amber-500 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
