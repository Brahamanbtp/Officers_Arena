"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, 
  X, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  Send, 
  Loader2,
  Bot,
  User,
  Brain
} from "lucide-react";

interface SocraticSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCorrect: boolean | null;
  explanation?: string;
  questionText?: string;
  topicName?: string;
  questionId?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const SocraticSidebar: React.FC<SocraticSidebarProps> = ({
  isOpen,
  onClose,
  isCorrect,
  explanation,
  questionText,
  topicName = "Indian Polity",
  questionId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial streaming breakdown fetch when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialPrompt = questionText 
        ? `Provide a step-by-step Socratic breakdown for this item: "${questionText.slice(0, 150)}..."` 
        : "Explain the underlying first principles and potential conceptual traps for this syllabus item.";
      
      handleStreamChat(initialPrompt);
    }
  }, [isOpen]);

  const handleStreamChat = async (userPrompt: string) => {
    if (!userPrompt.trim() || isStreaming) return;

    setIsStreaming(true);
    const userMsgId = `usr-${Date.now()}`;
    const botMsgId = `bot-${Date.now()}`;

    // Append User Message
    const userMsg: ChatMessage = { id: userMsgId, role: "user", content: userPrompt };
    
    // Append Placeholder Assistant Message
    const botPlaceholder: ChatMessage = { id: botMsgId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, botPlaceholder]);
    setInputMessage("");

    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId);
    const validQuestionId = isUUID ? questionId : "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

    try {
      const response = await fetch(`${apiEndpoint}/api/v1/tutor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "student_999",
          question_id: validQuestionId,
          message: userPrompt
        })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          // Stream word-by-word into bot message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId ? { ...msg, content: accumulatedText } : msg
            )
          );
        }
      } else {
        // Fallback explanation if API stream unavailable
        const fallbackText = explanation || "First-principles analysis based on standard syllabus materials.";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId ? { ...msg, content: fallbackText } : msg
          )
        );
      }
    } catch (err) {
      const fallbackText = explanation || "First-principles analysis based on standard syllabus materials.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId ? { ...msg, content: fallbackText } : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleStreamChat(inputMessage);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
          />

          {/* Sliding Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#111111] border-l border-neutral-850 shadow-2xl z-50 flex flex-col justify-between overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-850 flex items-center justify-between bg-neutral-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Streaming Socratic AI Tutor
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Grounded GraphRAG Memory (k=5)
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Chat Stream */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Status Badge */}
              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isCorrect === false
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}>
                <Lightbulb className="w-4 h-4 flex-shrink-0 animate-pulse text-amber-400" />
                <div className="text-xs font-medium leading-snug">
                  {isCorrect === false ? (
                    <span>
                      <strong className="font-bold text-white">Guided Learning Mode:</strong> Step-by-step first-principles analysis.
                    </span>
                  ) : (
                    <span>
                      <strong className="font-bold text-white">Mastery Verified:</strong> Deepening conceptual connections.
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl max-w-[85%] space-y-1 ${
                      msg.role === "user"
                        ? "bg-amber-600 text-neutral-950 font-bold rounded-tr-none shadow-md"
                        : "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none font-sans"
                    }`}
                  >
                    <p className="whitespace-pre-line font-normal">
                      {msg.content || (isStreaming && msg.role === "assistant" ? "Analyzing syllabus concepts..." : "")}
                    </p>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0 text-white mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isStreaming && (
                <div className="flex items-center gap-2 text-[11px] text-amber-400 font-mono pl-10">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Streaming GraphRAG Tutor Response...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Interactive Socratic Input Footer */}
            <div className="p-4 border-t border-neutral-850 bg-neutral-900/60">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask follow-up question to Socratic AI..."
                  disabled={isStreaming}
                  className="flex-1 bg-[#0a0a0a] border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isStreaming}
                  className="p-3 bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default SocraticSidebar;
