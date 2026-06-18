import { useRouter } from "expo-router";
import { WizardStepLayout } from "@/components/plan/WizardStepLayout";
import { FitnessSliders } from "@/components/plan/FitnessSliders";
import { usePlanWizardStore } from "@/stores/planWizardStore";

export default function Step4Screen() {
  const router = useRouter();
  const { answers, setFitness, setExperience } = usePlanWizardStore();

  return (
    <WizardStepLayout
      step={4}
      title="Your fitness & experience"
      subtitle="Be honest — we'll match you to treks that are right for you, not just impressive ones."
      onBack={() => router.back()}
      onNext={() => router.push("/(tabs)/plan/step-5" as never)}
      nextLabel="Continue →"
    >
      <FitnessSliders
        fitnessLevel={answers.fitnessLevel}
        experienceLevel={answers.experienceLevel}
        onFitnessChange={setFitness}
        onExperienceChange={setExperience}
      />
    </WizardStepLayout>
  );
}
