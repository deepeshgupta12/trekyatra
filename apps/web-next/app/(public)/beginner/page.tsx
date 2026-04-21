import { ContentPage } from "@/components/content/ContentPage";
import { Mountain } from "lucide-react";

export default function Beginner() {
  return (
    <ContentPage
      eyebrow="Beginner"
      title="Your first trek — start here"
      subtitle="If you've never trekked above 10,000 ft, read this before you book anything. India-specific, bullshit-free."
      icon={Mountain}
      blocks={[
        { eyebrow: "Mistakes", title: "11 mistakes first-time Indian trekkers make", bullets: ["Booking the cheapest operator", "Not training for 4 weeks", "Wearing brand new boots", "Skipping the medical certificate", "Underestimating altitude", "Cotton clothing", "Cheap rented sleeping bag", "Booking peak weekend dates", "Solo trekking unprepared", "Skipping travel insurance", "Not buffering 1 extra day"] },
        { eyebrow: "Picks", title: "Best first treks by city", cards: [
          { title: "From Mumbai", body: "Rajmachi, Kalsubai, Harishchandragad" },
          { title: "From Bangalore", body: "Kumara Parvatha, Tadiyandamol, Skandagiri" },
          { title: "From Delhi", body: "Nag Tibba, Kedarkantha, Brahmatal" },
        ] },
      ]}
    />
  );
}
