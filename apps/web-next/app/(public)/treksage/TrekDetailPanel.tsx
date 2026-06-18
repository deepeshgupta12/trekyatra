"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Mountain, MapPin, Clock, TrendingUp, ArrowUpRight, Calendar, IndianRupee,
} from "lucide-react";
import type { TrekCard } from "./TreksageChat";

interface Props {
  card: TrekCard;
  onClose?: () => void;
}

export default function TrekDetailPanel({ card }: Props) {
  const budgetText = card.budget_min && card.budget_max
    ? `₹${card.budget_min.toLocaleString()} – ₹${card.budget_max.toLocaleString()}`
    : card.budget_min
    ? `From ₹${card.budget_min.toLocaleString()}`
    : card.budget_max
    ? `Up to ₹${card.budget_max.toLocaleString()}`
    : null;

  const facts: Array<{ icon: React.ReactNode; label: string; value: string }> = [
    {
      icon: <Clock className="h-4 w-4 text-[#E8702A]" />,
      label: "Duration",
      value: card.duration || "—",
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-[#E8702A]" />,
      label: "Difficulty",
      value: card.difficulty || "—",
    },
    {
      icon: <Mountain className="h-4 w-4 text-[#E8702A]" />,
      label: "Max Altitude",
      value: card.max_altitude_ft ? `${card.max_altitude_ft.toLocaleString()} ft` : "—",
    },
    {
      icon: <Calendar className="h-4 w-4 text-[#E8702A]" />,
      label: "Best Season",
      value: card.season || "—",
    },
    {
      icon: <MapPin className="h-4 w-4 text-[#E8702A]" />,
      label: "State",
      value: card.state ? `${card.state}, India` : "—",
    },
    ...(budgetText ? [{
      icon: <IndianRupee className="h-4 w-4 text-[#E8702A]" />,
      label: "Budget",
      value: budgetText,
    }] : []),
  ];

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-[#1D3A2E]/10 shadow-sm"
      style={{ animation: "tsSlideUp 0.3s ease-out" }}
    >
      {/* Hero */}
      <div className="relative h-52 bg-[#FAF5EE]">
        {card.hero_image_url ? (
          <Image
            src={card.hero_image_url}
            alt={card.name}
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 60vw, 600px"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Mountain className="h-12 w-12 text-[#1D3A2E]/15" />
            <p className="text-[#1D3A2E]/25 text-xs">No image available</p>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1D3A2E]/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display font-bold text-white text-lg leading-tight">{card.name}</h3>
          {card.state && (
            <p className="flex items-center gap-1 text-white/65 text-xs mt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" /> {card.state}, India
            </p>
          )}
        </div>
      </div>

      {/* Key facts grid */}
      <div className="p-4">
        <h4 className="text-[10px] font-semibold text-[#1D3A2E]/40 uppercase tracking-wider mb-3">Trek Facts</h4>
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {facts.map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-2.5 bg-[#FAF5EE] rounded-xl p-2.5">
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="min-w-0">
                <p className="text-[#1D3A2E]/40 text-[9px] font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-[#1D3A2E] text-xs font-semibold leading-tight mt-0.5 capitalize">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/trek/${card.slug}?ref=treksage`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E8702A] text-white text-sm font-semibold hover:bg-[#d4621f] transition-colors shadow-sm"
          >
            View Full Trek Page <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/plan?q=${encodeURIComponent(card.name)}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1D3A2E]/20 text-[#1D3A2E] text-sm font-semibold hover:bg-[#1D3A2E]/5 transition-colors"
          >
            Plan This Trek
          </Link>
        </div>
      </div>
    </div>
  );
}
