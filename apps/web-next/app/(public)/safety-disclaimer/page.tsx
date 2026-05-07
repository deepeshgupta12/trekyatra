import { ContentPage } from "@/components/content/ContentPage";
import { Shield } from "lucide-react";

export default function SafetyDisclaimer() {
  return (
    <ContentPage
      eyebrow="Safety"
      title="Safety Disclaimer"
      subtitle="Read this before you plan a trek using our content. It could save your life."
      icon={Shield}
      blocks={[
        {
          title: "Trekking is a high-risk activity",
          body: "Trekking in the Himalayas, Sahyadris, and other Indian mountain ranges involves inherent physical risk including altitude sickness, adverse weather, trail hazards, and medical emergencies far from professional help. TrekYatra provides planning and information resources only. We are not responsible for any injury, illness, death, loss, or damage arising from use of our platform.",
        },
        {
          title: "Our content is not a substitute for professional guidance",
          bullets: [
            "Our trek guides are for planning purposes — not real-time navigation tools",
            "Trail conditions, permit requirements, and access rules change without notice",
            "Always verify conditions with a registered local operator or trek guide before departure",
            "Do not rely solely on TrekYatra data for safety-critical decisions",
            "Carry a physical map on remote treks — do not depend only on digital navigation",
          ],
        },
        {
          title: "Altitude and medical risks",
          body: "Acute Mountain Sickness (AMS) can occur above 8,000 ft and is life-threatening if ignored. We are not medical professionals. Consult a doctor before any trek above 12,000 ft, especially if you have cardiovascular or respiratory conditions. If you experience severe headache, loss of coordination, confusion, or breathing difficulty at altitude, descend immediately and seek medical help.",
        },
        {
          title: "Permit and regulatory information",
          body: "Permit rules change frequently. Our permit pages are re-verified every 14 days, but we cannot guarantee real-time accuracy. Always confirm requirements directly with the Forest Department or State Tourism Board before travel.",
        },
        {
          title: "Emergency contacts",
          cards: [
            { title: "National Emergency", body: "Dial 112 from any mobile in India." },
            { title: "SDRF Uttarakhand", body: "1070 or 9454417935" },
            { title: "Himachal Pradesh Police", body: "01902-222340 (Kullu)" },
            { title: "Kashmir Tourism", body: "0194-2452690" },
          ],
        },
        {
          title: "Insurance",
          body: "TrekYatra strongly recommends comprehensive travel insurance covering medical evacuation and altitude rescue. Standard policies often exclude high-altitude trekking — verify your policy explicitly covers the elevation of your planned trek.",
        },
        {
          title: "Limitation of liability",
          body: "To the fullest extent permitted by law, TrekYatra accepts no liability for loss, injury, death, or damage resulting from reliance on content published on this platform. By using TrekYatra, you accept full personal responsibility for your trekking decisions and activities.",
        },
      ]}
    />
  );
}
