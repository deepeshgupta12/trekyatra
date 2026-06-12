import { CMSHubScreen } from "@/components/cms/CMSHubScreen";

export default function BeginnerScreen() {
  return (
    <CMSHubScreen
      pageType="beginner_guide"
      title="Your first trek — start here"
      subtitle="India-specific, no-nonsense guides for first-time trekkers."
      emptyText="Beginner guides are being added — check back soon."
    />
  );
}
