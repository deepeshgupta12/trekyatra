import { CMSHubScreen } from "@/components/cms/CMSHubScreen";

export default function SafetyScreen() {
  return (
    <CMSHubScreen
      pageType="safety_guide"
      title="Trek Safely"
      subtitle="Altitude sickness, weather risks, and the precautions that keep treks safe."
      emptyText="Safety guides are being added — check back soon."
    />
  );
}
