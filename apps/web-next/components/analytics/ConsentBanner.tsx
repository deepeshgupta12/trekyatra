"use client";

import { useEffect, useState } from "react";
import { getConsent, setConsent } from "@/lib/analytics";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if consent has never been recorded
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("ty_consent");
    if (stored === null) setVisible(true);
  }, []);

  function accept() {
    setConsent(true);
    setVisible(false);
  }

  function decline() {
    setConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-[#0f1117]/95 backdrop-blur border-t border-white/10">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-white/80 text-sm leading-relaxed">
            We use cookies and analytics to improve your experience on TrekYatra.
            Your data is processed in accordance with the{" "}
            <strong className="text-white">DPDP Act 2023</strong>. You can
            withdraw consent at any time from your account settings.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="text-white/50 hover:text-white text-sm transition-colors underline underline-offset-2"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="bg-accent text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-accent/90 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
