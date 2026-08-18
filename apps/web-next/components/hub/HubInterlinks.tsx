import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface HubLink {
  label: string;
  href: string;
}
export interface HubLinkGroup {
  title: string;
  links: HubLink[];
}

/**
 * "Explore more" interlinking block shared by the region / season / category hubs. Gives every hub
 * page a dense set of contextual internal links (related regions, seasons, categories and planning
 * guides) beyond the trek cards, which strengthens crawl depth and topical authority.
 */
export function HubInterlinks({ groups }: { groups: HubLinkGroup[] }) {
  const nonEmpty = groups.filter((g) => g.links.length > 0);
  if (!nonEmpty.length) return null;
  return (
    <section className="py-14 border-t border-border">
      <div className="container-wide">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Keep exploring</div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold mb-8">Related treks, regions and guides</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {nonEmpty.map((g) => (
            <div key={g.title}>
              <h3 className="text-sm font-semibold text-foreground/90 mb-3">{g.title}</h3>
              <ul className="space-y-2.5">
                {g.links.map((l) => (
                  // key MUST NOT be `href + label` — that produced URL-like strings such as
                  // "/regions/himachalHimachal Pradesh" in the serialized RSC payload, which Google
                  // harvested and crawled as malformed 404 URLs (/regions/{slug}{Name}). Use a
                  // group-scoped, non-URL key instead.
                  <li key={`${g.title}:${l.label}`}>
                    <Link href={l.href} className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors">
                      {l.label}
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
