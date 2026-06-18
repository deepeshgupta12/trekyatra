import { useRouter } from "expo-router";
import { WizardStepLayout } from "@/components/plan/WizardStepLayout";
import { RegionSelector } from "@/components/plan/RegionSelector";
import { usePlanWizardStore } from "@/stores/planWizardStore";

export default function Step5Screen() {
  const router = useRouter();
  const { answers, setRegion } = usePlanWizardStore();

  return (
    <WizardStepLayout
      step={5}
      title="Preferred region"
      subtitle="Any corner of India in mind? Or leave it open."
      onBack={() => router.back()}
      onNext={() => router.push("/(tabs)/plan/step-6" as never)}
      nextLabel="Continue →"
    >
      <RegionSelector value={answers.region} onChange={setRegion} />
    </WizardStepLayout>
  );
}
