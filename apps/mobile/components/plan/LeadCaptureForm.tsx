import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
}

interface Props {
  data: LeadFormData;
  onChange: (data: LeadFormData) => void;
  error?: string | null;
}

export function LeadCaptureForm({ data, onChange, error }: Props) {
  const { colors, isDark } = useTheme();

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(29,58,46,0.05)",
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)",
      color: colors.textPrimary,
    },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.infoBox}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          An expert operator will reach out within 48 hours with a personalised plan based on your answers.
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Your name *</Text>
        <TextInput
          style={inputStyle}
          value={data.name}
          onChangeText={(v) => onChange({ ...data, name: v })}
          placeholder="Full name"
          placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Email address *</Text>
        <TextInput
          style={inputStyle}
          value={data.email}
          onChangeText={(v) => onChange({ ...data, email: v })}
          placeholder="you@example.com"
          placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Phone (optional)</Text>
        <TextInput
          style={inputStyle}
          value={data.phone}
          onChangeText={(v) => onChange({ ...data, phone: v })}
          placeholder="+91 98765 43210"
          placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
          keyboardType="phone-pad"
          returnKeyType="done"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  infoBox: { backgroundColor: "rgba(232,112,42,0.08)", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "rgba(232,112,42,0.2)" },
  infoText: { fontSize: 13, lineHeight: 19 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: "600" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  error: { color: "#ef4444", fontSize: 13 },
});
