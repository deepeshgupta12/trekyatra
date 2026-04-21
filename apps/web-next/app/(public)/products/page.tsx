import { ContentPage } from "@/components/content/ContentPage";
import { Download } from "lucide-react";

export default function Products() {
  return (
    <ContentPage
      eyebrow="Digital Products"
      title="Planning resources, made by trekkers"
      subtitle="Notion templates, PDF planners, training programs and packing systems."
      icon={Download}
      blocks={[
        { title: "Featured downloads", cards: [
          { title: "The Himalayan Packing System", body: "24-page PDF · ₹299" },
          { title: "First Trek Training Plan", body: "4-week program · ₹499" },
          { title: "Trekking Cost Calculator", body: "Notion template · Free" },
        ] },
      ]}
    />
  );
}
