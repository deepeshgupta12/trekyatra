"use client";

import { useState } from "react";
import { Sparkles, Send, Info } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";

const mdComponents: Components = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  h3: ({ children }) => <h3 className="font-semibold mt-2 mb-0.5 first:mt-0">{children}</h3>,
  h2: ({ children }) => <h2 className="font-semibold mt-2 mb-0.5 first:mt-0">{children}</h2>,
};
import { askTrekQuestion, ChatTurn } from "@/lib/api";

interface Props {
  slug: string;
  trekName: string;
}

const SUGGESTED_PROMPTS = [
  "Is this trek beginner-friendly?",
  "What's the best month to do this trek?",
  "Do I need a permit for this trek?",
  "What should I pack for this trek?",
];

interface QAExchange {
  question: string;
  answer: string;
  notVerified: boolean;
}

export default function TrekAskAI({ slug, trekName }: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<QAExchange[]>([]);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      // Build conversation history from existing exchanges (last 6 turns).
      const history: ChatTurn[] = exchanges
        .slice(-3)
        .flatMap((ex) => [
          { role: "user" as const, content: ex.question },
          { role: "assistant" as const, content: ex.answer },
        ]);
      const res = await askTrekQuestion(slug, trimmed, history.length > 0 ? history : undefined);
      setExchanges((prev) => [...prev, { question: trimmed, answer: res.answer, notVerified: res.not_verified }]);
      setQuestion("");
    } catch {
      setError("Couldn't get an answer right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="not-prose bg-card border border-border rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="font-display text-lg font-semibold">Ask TrekSage about {trekName}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Get instant answers grounded in verified trek data — beginner-friendliness, best months, permits, packing, and more.
      </p>

      {exchanges.length > 0 && (
        <div className="space-y-3 mb-4">
          {exchanges.map((ex, i) => (
            <div key={i} className="space-y-1.5">
              <div className="text-sm font-semibold text-foreground">{ex.question}</div>
              <div className={`text-sm leading-relaxed rounded-xl p-3 ${ex.notVerified ? "bg-warning/10 border border-warning/30 text-foreground/85" : "bg-surface-muted text-foreground/85"}`}>
                {ex.notVerified && (
                  <div className="flex items-center gap-1.5 text-warning text-xs font-semibold uppercase tracking-wide mb-1">
                    <Info className="h-3.5 w-3.5" /> Not verified yet
                  </div>
                )}
                <ReactMarkdown components={mdComponents}>{ex.answer}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="text-sm text-destructive mb-3">{error}</div>}

      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => ask(prompt)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this trek..."
          maxLength={500}
          disabled={loading}
          className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || question.trim().length < 3}
          className="px-4 py-2.5 rounded-xl bg-accent text-accent-foreground disabled:opacity-50 flex items-center justify-center"
          aria-label="Ask"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {loading && <div className="text-xs text-muted-foreground mt-2">TrekSage is thinking...</div>}
    </div>
  );
}
