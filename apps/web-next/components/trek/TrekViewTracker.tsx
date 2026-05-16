"use client";

import { useEffect } from "react";
import { recordTrekView } from "@/lib/behavior-tracker";

interface Props {
  slug: string;
  region: string;
  difficulty: string;
  season: string;
}

/** Invisible client component — records a trek page view in localStorage.
 *  Rendered inside the server-component trek detail page. */
export function TrekViewTracker({ slug, region, difficulty, season }: Props) {
  useEffect(() => {
    recordTrekView({ slug, region, difficulty, season });
  }, [slug, region, difficulty, season]);
  return null;
}
