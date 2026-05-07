"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface Lead {
  id: string;
  trek_interest: string;
  status: string;
  source_page: string;
  cta_type: string | null;
  created_at: string;
}

const statusIcon: Record<string, React.ReactNode> = {
  new: <Clock className="h-3.5 w-3.5 text-amber-500" />,
  contacted: <CheckCircle className="h-3.5 w-3.5 text-success" />,
  converted: <CheckCircle className="h-3.5 w-3.5 text-success" />,
  archived: <XCircle className="h-3.5 w-3.5 text-muted-foreground" />,
};

const statusStyle: Record<string, string> = {
  new: "text-amber-500 bg-amber-400/10 border border-amber-400/20",
  contacted: "text-success bg-success/10 border border-success/20",
  converted: "text-success bg-success/10 border border-success/20",
  archived: "text-muted-foreground bg-muted/20 border border-border",
};

export default function AccountEnquiries() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/sign-in?next=/account/enquiries");
      return;
    }
    if (user) {
      fetch("/api/v1/auth/me/leads")
        .then((r) => r.ok ? r.json() : [])
        .then(setLeads)
        .catch(() => setLeads([]))
        .finally(() => setLoading(false));
    }
  }, [user, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground mb-6">My Enquiries</h1>
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">My Enquiries</h1>
          <p className="text-muted-foreground text-sm">Trek inquiries and lead forms you have submitted.</p>
        </div>
        <Link href="/operators">
          <Button variant="hero" size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> New enquiry
          </Button>
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium mb-1">No enquiries yet</p>
          <p className="text-sm text-muted-foreground mb-4">Submit an inquiry from any trek or operator page.</p>
          <Link href="/operators">
            <Button variant="outline" size="sm">Browse operators</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-foreground text-sm">{lead.trek_interest}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${statusStyle[lead.status] ?? statusStyle.new}`}>
                    {statusIcon[lead.status]} {lead.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Via {lead.cta_type?.replace("_", " ") ?? "contact form"} · {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
