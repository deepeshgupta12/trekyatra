import { useState } from "react";
import { ActivityIndicator, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { WizardStepLayout } from "@/components/plan/WizardStepLayout";
import { LeadCaptureForm, type LeadFormData } from "@/components/plan/LeadCaptureForm";
import { usePlanWizardStore } from "@/stores/planWizardStore";
import { leadsApi } from "@/lib/mobileApi";
import { useAuth } from "@/hooks/useAuth";

export default function Step6Screen() {
  const router = useRouter();
  const { answers } = usePlanWizardStore();
  const { user } = useAuth();
  const [form, setForm] = useState<LeadFormData>({
    name: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goResults() {
    router.push("/(tabs)/plan/results" as never);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const region = answers.region ?? "Any region";
      const monthSummary = answers.months.includes("flexible") || answers.months.length === 0
        ? "Flexible"
        : answers.months.join(", ");
      await leadsApi.submitOperatorHelp({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        trek_interest: answers.intent.join(", ") || "General trekking",
        message: `Months: ${monthSummary} | Duration: ${answers.durationMin}–${answers.durationMax} days | Region: ${region}`,
        travel_month: monthSummary,
        consent: true,
        source_page: "/mobile/plan-wizard",
      });
    } catch {
      // Don't block results even if lead submission fails
    } finally {
      setSubmitting(false);
      goResults();
    }
  }

  return (
    <WizardStepLayout
      step={6}
      title="Get your personalised plan"
      subtitle="Share your contact details and an operator will reach out within 48 hours with a custom itinerary."
      onBack={() => router.back()}
      onNext={handleSubmit}
      nextLabel={submitting ? "Sending…" : "Get my plan →"}
      nextDisabled={submitting}
      skipLabel="Skip →"
      onSkip={goResults}
    >
      <LeadCaptureForm data={form} onChange={setForm} error={error} />
      {submitting && <ActivityIndicator color="#E8702A" style={styles.spinner} />}
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  spinner: { marginTop: 16 },
});
