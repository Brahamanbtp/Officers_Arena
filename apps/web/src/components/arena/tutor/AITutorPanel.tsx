"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Send, 
  X, 
  HelpCircle, 
  BookOpen, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  MessageSquare
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { useChat } from "../../../hooks/useChat";

interface SourceCitation {
  id: string;
  source_book: string;
  page_number: number;
  chapter_title: string;
  text_chunk: string;
}

interface AITutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  userAnswer?: string;
  correctAnswer?: string;
  examType: string;
  userId?: string;
  currentTopicId?: string;
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  isOpen,
  onClose,
  questionId,
  userAnswer,
  correctAnswer,
  examType,
  userId = "student_999",
  currentTopicId
}) => {
  const [explanation, setExplanation] = useState<string>("");
  const [sources, setSources] = useState<SourceCitation[]>([]);
  const [errorAnalysis, setErrorAnalysis] = useState<{
    error_category: string;
    identified_gap: string;
    recommendation: string;
  } | null>(null);
  
  const { messages: chatMessages, sendMessage, clearMessages, loading: chatLoading } = useChat(questionId, userId);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"tutor" | "chat">("tutor");
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch tutor Socratic explanation
  const fetchExplanation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/tutor/explain?question_id=${questionId}&user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setExplanation(data.explanation);
        setSources(data.sources || []);
      } else {
        setExplanation("Failed to synchronize explanation. Please check your network connection.");
      }
    } catch (e) {
      setExplanation("Unable to contact the AI Tutor system.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch error analysis if answer was submitted
  const fetchErrorAnalysis = async () => {
    if (!userAnswer || userAnswer === correctAnswer) {
      setErrorAnalysis(null);
      return;
    }
    try {
      const res = await fetch(`/api/v1/tutor/analyze-error?question_id=${questionId}&user_answer=${userAnswer}&user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setErrorAnalysis(data);
      }
    } catch (e) {
      console.error("Failed to analyze errors:", e);
    }
  };

  // Trigger Socratic hint manually
  const triggerHint = async () => {
    setActiveTab("tutor");
    if (userAnswer) {
      await fetchErrorAnalysis();
    } else {
      await fetchExplanation();
    }
  };

  // Send message in chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setInputText("");
    await sendMessage(userMsg);
  };

  // Scroll chat messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load explanation & errors on change
  useEffect(() => {
    if (isOpen && questionId) {
      fetchExplanation();
      fetchErrorAnalysis();
      clearMessages();
    }
  }, [isOpen, questionId, userAnswer]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header section */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black tracking-tight text-white">AI Pedagogical Tutor</h3>
                  <p className="text-[10px] text-neutral-500">Adhyayan • Socratic Guidance Mode</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-850 rounded-lg text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Tabs */}
            <div className="flex border-b border-neutral-850 p-2 bg-neutral-900/40">
              <button
                onClick={() => setActiveTab("tutor")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "tutor" ? "bg-amber-600/10 text-amber-400 border border-amber-500/20" : "text-neutral-400 hover:text-neutral-300"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Socratic Explanations
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "chat" ? "bg-amber-600/10 text-amber-400 border border-amber-500/20" : "text-neutral-400 hover:text-neutral-300"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Direct Inquiry Chat
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
              {activeTab === "tutor" ? (
                <>
                  {/* Step-wise Error Diagnostics Banner if answered incorrectly */}
                  {errorAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase text-red-400 tracking-wider">
                          Error Diagnosed: {errorAnalysis.error_category}
                        </span>
                        <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">{errorAnalysis.identified_gap}</p>
                        <div className="text-[10px] text-emerald-400 font-medium mt-1">
                          Pedagogical Correction: {errorAnalysis.recommendation}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Socratic Hint / Explanation content */}
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-xs text-neutral-400 gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                      Traversing syllabus hierarchy & retrieving textbook references...
                    </div>
                  ) : (
                    <div className="bg-neutral-950/30 border border-neutral-850 p-4 rounded-xl flex flex-col gap-3">
                      <div className="text-xs leading-relaxed text-neutral-300 font-sans prose prose-invert max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                        >
                          {explanation || "Request a pedagogical hint or complete the attempt to generate an explanation."}
                        </ReactMarkdown>
                      </div>

                      {/* Source Book Metadata Chips */}
                      {sources.length > 0 && (
                        <div className="mt-4 border-t border-neutral-850/80 pt-3">
                          <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-indigo-400" /> Referenced Grounding Sources
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {sources.map((c, i) => (
                              <div key={i} className="flex flex-col w-full">
                                <button
                                  onClick={() => setExpandedCitation(expandedCitation === i ? null : i)}
                                  className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-[10px] font-bold text-neutral-300 transition-all flex items-center justify-between text-left"
                                >
                                  <span className="font-bold text-amber-500">{c.source_book}</span>
                                  <span className="text-[8px] font-mono text-neutral-500 ml-2">
                                    {c.chapter_title} (Page {c.page_number})
                                  </span>
                                </button>
                                
                                <AnimatePresence>
                                  {expandedCitation === i && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden bg-neutral-950/80 p-2.5 border border-t-0 border-neutral-850 rounded-b-lg text-[10px] text-neutral-400 leading-relaxed italic"
                                    >
                                      "{c.text_chunk}"
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Hint Trigger */}
                  <div className="mt-auto pt-4 flex gap-2">
                    <button
                      onClick={triggerHint}
                      className="flex-grow py-2 bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      Request Socratic Hint
                    </button>
                  </div>
                </>
              ) : (
                /* Chat view */
                <div className="flex flex-col h-full gap-3">
                  {/* Message logs */}
                  <div className="flex-grow overflow-y-auto flex flex-col gap-3 min-h-[300px] max-h-[420px] p-2 bg-neutral-950/20 border border-neutral-850 rounded-xl">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-[10px] text-neutral-500 py-12">
                        No active chat history. Ask about statements, reasoning, or request references.
                      </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.role === "user" 
                            ? "bg-amber-600/10 border border-amber-500/20 text-white self-end rounded-tr-none" 
                            : "bg-neutral-850 text-neutral-200 self-start rounded-tl-none border border-neutral-800"
                        }`}
                      >
                        <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                          {msg.role === "user" ? "You" : "Adhyayan"}
                        </span>
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkMath]} 
                            rehypePlugins={[rehypeKatex]}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Nested citations in message */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-neutral-800/40 flex flex-wrap gap-1">
                            {msg.sources.map((c, ci) => (
                              <span 
                                key={ci} 
                                title={c.text_chunk}
                                className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[8px] font-mono text-neutral-400"
                              >
                                {c.source_book}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex items-center gap-1.5 text-neutral-500 text-[10px] p-2">
                        <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                        Adhyayan is typing Socratic response...
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask the tutor..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-grow bg-neutral-950 border border-neutral-800 focus:border-amber-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-neutral-500"
                    />
                    <button
                      type="submit"
                      disabled={loading || !inputText.trim()}
                      className="p-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 rounded-xl transition-all text-white flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AITutorPanel;
