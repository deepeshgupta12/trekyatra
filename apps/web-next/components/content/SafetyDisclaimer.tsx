import { AlertTriangle } from "lucide-react";

interface Props {
  message?: string;
}

export default function SafetyDisclaimer({ message }: Props) {
  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-warning/8 border border-warning/25 text-sm">
      <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
      <p className="text-foreground/80 leading-relaxed">
        {message ?? "Always trek with a registered guide or operator. Carry emergency contacts, a first-aid kit, and inform someone of your route before departure."}
      </p>
    </div>
  );
}
