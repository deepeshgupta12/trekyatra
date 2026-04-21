import { MessageSquare, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ENQUIRIES = [
  {
    id: "ENQ-001",
    trek: "Kedarkantha Winter Trek",
    operator: "India Hikes",
    date: "Dec 28 – Jan 5",
    status: "replied",
    preview: "Hi! Thanks for reaching out. We have slots available for Dec 28 departure...",
    updated: "2 days ago",
  },
  {
    id: "ENQ-002",
    trek: "Valley of Flowers",
    operator: "Trek the Himalayas",
    date: "Aug 5 – Aug 12",
    status: "pending",
    preview: "Your enquiry has been received. We&apos;ll respond within 24 hours.",
    updated: "5 hours ago",
  },
];

const statusConfig = {
  replied: { label: "Replied", color: "text-pine", bg: "bg-pine/10", icon: CheckCircle },
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
};

export default function Enquiries() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Enquiries</h1>
        <p className="text-muted-foreground">Messages you&apos;ve sent to trek operators.</p>
      </div>

      {ENQUIRIES.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">No enquiries yet</h2>
          <p className="text-muted-foreground mb-6">Use the &quot;Plan this trek&quot; form on any trek page to contact operators.</p>
          <Link href="/explore" className="text-accent font-medium text-sm">Explore treks →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ENQUIRIES.map(enq => {
            const { label, color, bg, icon: Icon } = statusConfig[enq.status as keyof typeof statusConfig];
            return (
              <div key={enq.id} className="bg-surface rounded-2xl border border-border p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-medium">{enq.trek}</h3>
                    <p className="text-sm text-muted-foreground">{enq.operator} · {enq.date}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${color} ${bg}`}>
                    <Icon className="h-3 w-3" /> {label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{enq.preview}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Updated {enq.updated}</span>
                  <Button variant="outline" size="sm">View thread</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
