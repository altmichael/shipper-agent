"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Kick off with the agent's opening message
    sendMessage("I'm here. Let's go.", true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string, isOpening = false) {
    const userMessage: Message = { role: "user", content: text };
    const nextMessages = isOpening ? [userMessage] : [...messages, userMessage];

    if (!isOpening) {
      setMessages(nextMessages);
      setInput("");
    }

    setStreaming(true);

    // Add empty assistant message to stream into
    setMessages((prev) => [
      ...(isOpening ? [] : prev),
      ...(isOpening ? [userMessage] : []),
      { role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Try refreshing.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !streaming) sendMessage(input.trim());
    }
  }

  return (
    <main className="min-h-screen flex flex-col font-mono bg-black">
      {/* Header */}
      <header className="border-b border-zinc-900 px-6 py-4 flex items-center gap-3">
        <span className="text-yellow-400 font-bold">🚀 Shipper Agent</span>
        <span className="text-zinc-600 text-sm">— your co-founder is ready</span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl w-full mx-auto">
        {messages
          .filter((m) => m.role !== "user" || m.content !== "I'm here. Let's go.")
          .map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="text-yellow-400 text-sm mt-1 shrink-0">🚀</div>
              )}
              <div
                className={`rounded px-4 py-3 max-w-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-zinc-800 text-white"
                    : "bg-zinc-950 border border-zinc-800 text-zinc-100"
                }`}
              >
                {msg.content}
                {msg.role === "assistant" && streaming && i === messages.length - 1 && (
                  <span className="inline-block w-2 h-4 bg-yellow-400 ml-1 animate-pulse" />
                )}
              </div>
              {msg.role === "user" && (
                <div className="text-zinc-500 text-sm mt-1 shrink-0">you</div>
              )}
            </div>
          ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-900 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what you're building..."
            disabled={streaming}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition-colors resize-none text-sm disabled:opacity-50"
          />
          <button
            onClick={() => input.trim() && !streaming && sendMessage(input.trim())}
            disabled={streaming || !input.trim()}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-3 rounded transition-colors disabled:opacity-30 text-sm"
          >
            Send
          </button>
        </div>
        <p className="text-zinc-700 text-xs text-center mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </main>
  );
}
