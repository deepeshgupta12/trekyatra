import { CMSHubScreen } from "@/components/cms/CMSHubScreen";

export default function PermitsScreen() {
  return (
    <CMSHubScreen
      pageType="permit_guide"
      title="Permits & Inner Line Rules"
      subtitle="Region-wise permit requirements, forms, and how to get them sorted before you go."
      emptyText="Permit guides are being added — check back soon."
    />
  );
}
