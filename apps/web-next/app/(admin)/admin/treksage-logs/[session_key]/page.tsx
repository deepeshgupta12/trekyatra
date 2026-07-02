"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, UserX, MessageSquare } from "lucide-react";
import { fetchTreksageSessionTranscript, type SessionTranscriptOut } from "@/lib/api";

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function SessionTranscriptPage({ params }: { params: { session_key: string } }) {
  const sessionKey = decodeURIComponent(params.session_key);
  const [transcript, setTranscript] = useState<SessionTranscriptOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTreksageSessionTranscript(sessionKey)
      .then(setTranscript)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load transcript"))
      .finally(() => setLoading(false));
  }, [sessionKey]);

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <Link href="/admin/treksage-logs" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-xs mb-3 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to logs
          </Link>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Conversation Transcript</h1>
          <p className="text-white/40 text-xs font-mono">{sessionKey}</p>
        </div>
      </div>

      {loading && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-8 text-center text-white/30 text-sm">Loading…</div>
      )}

      {error && (
        <div className="bg-[#14161f] rounded-2xl border border-red-400/20 p-6 text-red-400 text-sm">{error}</div>
      )}

      {transcript && (
        <>
          {/* Session meta card */}
          <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-white/40 text-xs font-medium mb-1">User</p>
                {transcript.is_anonymous ? (
                  <span className="inline-flex items-center gap-1 text-xs text-white/30">
                    <UserX className="h-3.5 w-3.5" /> Anonymous
                  </span>
                ) : (
                  <div>
                    <p className="text-white/80 text-sm font-medium">{transcript.user_name ?? "—"}</p>
                    <p className="text-white/35 text-xs font-mono">{transcript.user_email}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-white/40 text-xs font-medium mb-1">User ID</p>
                <p className="text-white/50 text-xs font-mono truncate">{transcript.user_id ?? "—"}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs font-medium mb-1">CDP Anonymous ID</p>
                <p className="text-white/50 text-xs font-mono truncate" title={transcript.anonymous_id ?? undefined}>
                  {transcript.anonymous_id ?? <span className="text-white/20">not captured</span>}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/8">
              <div>
                <p className="text-white/40 text-xs font-medium mb-1">Started</p>
                <p className="text-white/60 text-xs">{fmt(transcript.created_at)}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs font-medium mb-1">Last active</p>
                <p className="text-white/60 text-xs">{fmt(transcript.last_active_at)}</p>
              </div>
            </div>
          </div>

          {/* Message thread */}
          {transcript.messages.length === 0 ? (
            <div className="bg-[#14161f] rounded-2xl border border-white/10 p-8 text-center">
              <MessageSquare className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No messages in this session yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transcript.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    msg.role === "user"
                      ? "bg-accent/15 text-accent border border-accent/20"
                      : "bg-pine/10 text-pine border border-pine/20"
                  }`}>
                    {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : "AI"}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-accent/10 border border-accent/15 text-white/80"
                      : "bg-[#14161f] border border-white/10 text-white/80"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-accent/50 text-right" : "text-white/25"}`}>
                      {fmtTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
