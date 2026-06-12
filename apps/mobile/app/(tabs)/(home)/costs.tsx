import { CMSHubScreen } from "@/components/cms/CMSHubScreen";

export default function CostsScreen() {
  return (
    <CMSHubScreen
      pageType="cost_guide"
      title="Trek Costs, Honestly Broken Down"
      subtitle="What treks actually cost — transport, permits, gear rental, food, and operator fees."
      emptyText="Cost guides are being added — check back soon."
    />
  );
}
