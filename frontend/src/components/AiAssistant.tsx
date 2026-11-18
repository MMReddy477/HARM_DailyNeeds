import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STORE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = ["What are your xerox rates?", "Do you have Classmate long books?", "What time do you open?"];

function sessionId(): string {
  let sid = sessionStorage.getItem("harm-ai-session");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("harm-ai-session", sid);
  }
  return sid;
}

// "Ask H.A.R.M" storefront assistant — streams the backend's SSE response token by token.
export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! I'm the H.A.R.M assistant. Ask me about notebooks, pens, xerox rates, timings — anything at all!" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sidRef = useRef<string>(sessionId());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const history = messages
        .slice(1) // drop the greeting
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sidRef.current, message, history }),
      });
      if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let reply = "";
      streamLoop: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const payload = JSON.parse(line.slice(5).trim()) as { delta?: string; done?: boolean; reply?: string; error?: string };
          if (payload.error) throw new Error(payload.error);
          if (payload.delta) {
            reply += payload.delta;
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: reply };
              return copy;
            });
          }
          if (payload.done) {
            reply = payload.reply || reply;
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: reply || "…" };
              return copy;
            });
            break streamLoop;
          }
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `Sorry, I couldn't answer right now. Please call or WhatsApp ${STORE.phoneDisplay}.`,
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open ? (
        <div
          data-testid="ai-chat-panel"
          className="fixed inset-x-3 bottom-20 z-50 flex max-h-[70svh] flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[380px]"
        >
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-purple-800 to-purple-950 px-4 py-3 text-white">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
              <Bot className="size-4.5" />
            </span>
            <div className="flex-1">
              <p className="font-heading text-sm font-bold">Ask H.A.R.M</p>
              <p className="text-[11px] text-purple-200">AI helper · answers in seconds</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" data-testid="ai-chat-close-button" className="rounded-full p-1.5 hover:bg-white/15">
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3" data-testid="ai-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <p
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                    m.role === "user" ? "rounded-br-sm bg-purple-700 text-white" : "rounded-bl-sm bg-purple-50 text-slate-800"
                  )}
                  data-testid={`ai-chat-message-${m.role}-${i}`}
                >
                  {m.content.replace(/\*\*/g, "")}
                </p>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <p className="rounded-2xl rounded-bl-sm bg-purple-50 px-3 py-2 text-[13px] text-purple-500">typing…</p>
              </div>
            ) : null}
            {messages.length === 1 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    data-testid={`ai-chat-quick-prompt-${QUICK_PROMPTS.indexOf(p)}`}
                    className="rounded-full border border-purple-200 px-2.5 py-1 text-[11px] font-medium text-purple-700 transition-colors hover:bg-purple-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            className="flex items-center gap-2 border-t border-purple-100 p-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, xerox rates…"
              data-testid="ai-chat-input"
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} data-testid="ai-chat-send-button">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="ai-assistant-launcher"
        aria-label="Open AI assistant"
        className="fixed bottom-4 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-700 to-purple-950 text-white shadow-xl transition-transform duration-200 hover:scale-110"
      >
        {open ? <X className="size-5" /> : <Sparkles className="size-5" />}
        {!open ? <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-amber-400" /> : null}
      </button>
    </>
  );
}
