import { MapPin, Tag } from "lucide-react";
import LeadForm from "./LeadForm";

export interface Operator {
  name: string;
  region: string;
  trekTypes: string[];
  description?: string;
  sourcePage: string;
}

interface Props {
  operator: Operator;
}

export default function OperatorCard({ operator }: Props) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-base">{operator.name}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {operator.region}
          </span>
          {operator.trekTypes.slice(0, 3).map((t) => (
            <span key={t} className="flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
              <Tag className="h-2.5 w-2.5" /> {t}
            </span>
          ))}
        </div>
        {operator.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{operator.description}</p>
        )}
      </div>
      <div className="pt-3 border-t border-border">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Send an enquiry</p>
        <LeadForm sourcePage={operator.sourcePage} ctaType="operator_card" compact />
      </div>
    </div>
  );
}
