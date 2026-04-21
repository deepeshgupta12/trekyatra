import { Mountain } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-gradient-twilight text-surface flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full glass-dark mb-6">
          <Mountain className="h-9 w-9 text-accent-glow" />
        </div>
        <h1 className="font-display text-5xl font-semibold mb-3">Quick refresh</h1>
        <p className="text-surface/80 mb-8">TrekYatra is getting a small update. We&apos;ll be back in about 15 minutes.</p>
        <div className="text-sm text-surface/60">
          For urgent enquiries, email{" "}
          <a className="text-accent-glow underline" href="mailto:hello@trekyatra.in">hello@trekyatra.in</a>
        </div>
      </div>
    </div>
  );
}
