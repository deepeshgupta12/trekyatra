import { Terminal, CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";

const LOGS = [
  { time: "14:32:01", agent: "ContentWriter", action: "Draft generated", article: "Roopkund Trek Guide", status: "success", duration: "1m 42s" },
  { time: "14:28:15", agent: "FactChecker", action: "Claim verified", article: "Kedarkantha Guide", status: "success", duration: "0m 08s" },
  { time: "14:25:44", agent: "TopicDiscovery", action: "Keyword analysis", article: "—", status: "success", duration: "2m 15s" },
  { time: "14:20:30", agent: "BriefGenerator", action: "Brief created", article: "Chopta Tungnath Trek", status: "success", duration: "0m 54s" },
  { time: "14:18:02", agent: "FactChecker", action: "Claim flagged", article: "Hampta Pass Itinerary", status: "warning", duration: "0m 06s" },
  { time: "14:10:55", agent: "ContentWriter", action: "Draft failed — timeout", article: "Monsoon Safety Tips", status: "error", duration: "5m 00s" },
  { time: "14:05:12", agent: "LinkSuggestor", action: "Links suggested (4)", article: "Multiple", status: "success", duration: "0m 31s" },
  { time: "13:58:44", agent: "TopicDiscovery", action: "Clusters rebuilt", article: "—", status: "running", duration: "ongoing" },
];

const statusConfig = {
  success: { icon: CheckCircle, color: "text-pine" },
  warning: { icon: AlertCircle, color: "text-amber-400" },
  error: { icon: XCircle, color: "text-destructive" },
  running: { icon: Clock, color: "text-blue-400" },
};

export default function AgentLogs() {
  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Agent Logs</h1>
          <p className="text-white/50 text-sm">Real-time activity log for all AI pipeline agents.</p>
        </div>
        <span className="flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          1 agent running
        </span>
      </div>

      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden font-mono text-xs">
        <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-white/30" />
          <span className="text-white/30">pipeline.log — live tail</span>
        </div>
        <div className="divide-y divide-white/5">
          {LOGS.map((log, i) => {
            const { icon: Icon, color } = statusConfig[log.status as keyof typeof statusConfig];
            return (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors">
                <span className="text-white/30 flex-shrink-0 w-16">{log.time}</span>
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                <span className="text-accent/80 flex-shrink-0 w-28 truncate">[{log.agent}]</span>
                <span className="text-white/70 flex-1">{log.action}</span>
                <span className="text-white/30 truncate max-w-[160px] hidden md:block">{log.article}</span>
                <span className="text-white/25 flex-shrink-0">{log.duration}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
