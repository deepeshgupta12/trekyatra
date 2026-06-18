import { useRouter } from "expo-router";
import { WizardStepLayout } from "@/components/plan/WizardStepLayout";
import { MonthSelector } from "@/components/plan/MonthSelector";
import { usePlanWizardStore } from "@/stores/planWizardStore";

export default function Step2Screen() {
  const router = useRouter();
  const { answers, setMonths } = usePlanWizardStore();

  return (
    <WizardStepLayout
      step={2}
      title="When are you planning to go?"
      subtitle="Select the months you're available. Multi-select is fine."
      onBack={() => router.back()}
      onNext={() => router.push("/(tabs)/plan/step-3" as never)}
      nextLabel="Continue →"
    >
      <MonthSelector value={answers.months} onChange={setMonths} />
    </WizardStepLayout>
  );
}
