import { useRouter } from "expo-router";
import { WizardStepLayout } from "@/components/plan/WizardStepLayout";
import { IntentSelector } from "@/components/plan/IntentSelector";
import { usePlanWizardStore } from "@/stores/planWizardStore";

export default function Step1Screen() {
  const router = useRouter();
  const { answers, setIntent } = usePlanWizardStore();

  return (
    <WizardStepLayout
      step={1}
      title="What kind of trek are you looking for?"
      subtitle="Pick all that apply — we'll find treks that match your vibe."
      onBack={() => router.back()}
      onNext={() => router.push("/(tabs)/plan/step-2" as never)}
      nextLabel="Continue →"
    >
      <IntentSelector value={answers.intent} onChange={setIntent} />
    </WizardStepLayout>
  );
}
