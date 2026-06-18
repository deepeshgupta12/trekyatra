import { useRouter } from "expo-router";
import { WizardStepLayout } from "@/components/plan/WizardStepLayout";
import { DurationSelector } from "@/components/plan/DurationSelector";
import { usePlanWizardStore } from "@/stores/planWizardStore";

export default function Step3Screen() {
  const router = useRouter();
  const { answers, setDuration } = usePlanWizardStore();

  return (
    <WizardStepLayout
      step={3}
      title="How long can you trek?"
      subtitle="How many days can you be away from home?"
      onBack={() => router.back()}
      onNext={() => router.push("/(tabs)/plan/step-4" as never)}
      nextLabel="Continue →"
    >
      <DurationSelector
        durationMin={answers.durationMin}
        durationMax={answers.durationMax}
        onChange={setDuration}
      />
    </WizardStepLayout>
  );
}
