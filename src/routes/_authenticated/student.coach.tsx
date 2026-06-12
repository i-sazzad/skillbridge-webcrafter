import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useStudent } from "@/lib/student-data";
import { Sparkles, Send, Loader2, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/coach")({
  component: CoachPage,
});

const SUGGESTIONS = [
  "What should I learn next to land my dream role?",
  "Give me a 4-week study plan for my top skill gap.",
  "Which Dhaka employers fit me best right now?",
  "Am I salary-competitive for entry-level in my target role?",
];

function CoachPage() {
  const { targetRole, needsOnboarding, loading } = useStudent();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/coach",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const tok = data.session?.access_token;
          const headers = new Headers(init?.headers);
          if (tok) headers.set("Authorization", `Bearer ${tok}`);
          return fetch(input, { ...init, headers });
        },
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: "coach",
    transport,
  });



  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy || !token) return;
    void sendMessage({ text: t });
    setInput("");
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (needsOnboarding) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Set your target role on your dashboard first — the coach uses it for everything.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          AI Coach
        </div>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-extrabold tracking-tight">
          <Sparkles className="h-7 w-7 text-primary" /> Your career mentor
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grounded in your skills, gaps, and live employer demand. Targeting{" "}
          <span className="font-semibold text-foreground">{targetRole?.title}</span>.
        </p>
      </div>

      <Card ref={scrollRef as never} className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold">Ask me anything about your career.</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                I'll use your live skill profile and the Bangladesh job market to answer.
              </p>
              <div className="mt-6 grid gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((m: UIMessage) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      isUser
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{text}</div>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-strong:text-foreground prose-headings:text-foreground">
                        <ReactMarkdown>{text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {status === "submitted" && (
              <div className="flex gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error.message ?? "Coach is unavailable. Try again."}
              </div>
            )}
          </div>
        )}
      </Card>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-end gap-2"
      >
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask your AI coach…"
          className="min-h-[48px] resize-none"
          disabled={!token || busy}
        />
        <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={!token || busy || !input.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
