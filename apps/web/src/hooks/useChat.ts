import { useState, useCallback } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
}

export const useChat = (questionId: string, userId: string = "student_999") => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message to state
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/v1/tutor/chat?question_id=${questionId}&user_id=${userId}&message=${encodeURIComponent(text)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }
      );

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      if (!res.body) {
        throw new Error("ReadableStream not supported");
      }

      // Add placeholder assistant message
      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulated = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulated += chunk;
          setMessages((prev) => {
            const next = [...prev];
            if (next.length > 0) {
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: accumulated
              };
            }
            return next;
          });
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue while retrieving the response."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [questionId, userId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    loading
  };
};
