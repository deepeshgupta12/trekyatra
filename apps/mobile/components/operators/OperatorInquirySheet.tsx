import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useSubmitInquiry } from "@/hooks/useOperators";
import { useAuth } from "@/hooks/useAuth";

interface OperatorInquirySheetProps {
  visible: boolean;
  operatorName: string;
  operatorSlug: string;
  onClose: () => void;
}

export function OperatorInquirySheet({
  visible,
  operatorName,
  operatorSlug,
  onClose,
}: OperatorInquirySheetProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { mutate: submit, isPending, isSuccess, reset } = useSubmitInquiry();

  const [name, setName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [trekInterest, setTrekInterest] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim() || !email.includes("@")) e.email = "Valid email is required";
    if (!trekInterest.trim()) e.trekInterest = "Trek of interest is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    submit(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        trek_interest: trekInterest.trim(),
        message: message.trim() || null,
        operator_slug: operatorSlug,
      },
      {
        onError: () =>
          setErrors({ submit: "Could not send enquiry. Please try again." }),
      }
    );
  }

  function handleClose() {
    reset();
    setErrors({});
    onClose();
  }

  const inputStyle = {
    fontFamily: "Inter_400Regular" as const,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  };

  const labelStyle = {
    fontFamily: "Inter_500Medium" as const,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: colors.border,
            maxHeight: "85%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 4,
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_700Bold",
                fontSize: 18,
                color: colors.textPrimary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              Enquire — {operatorName}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isSuccess ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: "#22c55e20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
                </View>
                <Text
                  style={{
                    fontFamily: "PlayfairDisplay_700Bold",
                    fontSize: 18,
                    color: colors.textPrimary,
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  Enquiry sent!
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 13,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 20,
                  }}
                >
                  {operatorName} will get back to you within 48 hours.
                  {"\n"}Check your inbox for a confirmation email.
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={{
                    marginTop: 24,
                    backgroundColor: colors.accent,
                    borderRadius: 14,
                    paddingHorizontal: 32,
                    paddingVertical: 13,
                  }}
                  accessibilityRole="button"
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 15,
                      color: "#fff",
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Name */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={labelStyle}>Name *</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your full name"
                    placeholderTextColor={colors.textMuted}
                    style={[inputStyle, errors.name ? { borderColor: "#ef4444" } : {}]}
                    autoCapitalize="words"
                    accessibilityLabel="Your name"
                  />
                  {errors.name ? (
                    <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 3, fontFamily: "Inter_400Regular" }}>
                      {errors.name}
                    </Text>
                  ) : null}
                </View>

                {/* Email */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={labelStyle}>Email *</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[inputStyle, errors.email ? { borderColor: "#ef4444" } : {}]}
                    accessibilityLabel="Email address"
                  />
                  {errors.email ? (
                    <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 3, fontFamily: "Inter_400Regular" }}>
                      {errors.email}
                    </Text>
                  ) : null}
                </View>

                {/* Phone */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={labelStyle}>Phone (optional)</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    style={inputStyle}
                    accessibilityLabel="Phone number"
                  />
                </View>

                {/* Trek of interest */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={labelStyle}>Trek of interest *</Text>
                  <TextInput
                    value={trekInterest}
                    onChangeText={setTrekInterest}
                    placeholder="e.g. Kedarkantha, Hampta Pass…"
                    placeholderTextColor={colors.textMuted}
                    style={[inputStyle, errors.trekInterest ? { borderColor: "#ef4444" } : {}]}
                    accessibilityLabel="Trek of interest"
                  />
                  {errors.trekInterest ? (
                    <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 3, fontFamily: "Inter_400Regular" }}>
                      {errors.trekInterest}
                    </Text>
                  ) : null}
                </View>

                {/* Message */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={labelStyle}>Message (optional)</Text>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Preferred dates, group size, any questions…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                    style={[
                      inputStyle,
                      { height: 90, textAlignVertical: "top", paddingTop: 11 },
                    ]}
                    accessibilityLabel="Additional message"
                  />
                </View>

                {errors.submit ? (
                  <Text
                    style={{
                      color: "#ef4444",
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      marginBottom: 12,
                      textAlign: "center",
                    }}
                  >
                    {errors.submit}
                  </Text>
                ) : null}

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isPending}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Send enquiry"
                  style={{
                    backgroundColor: colors.accent,
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: "center",
                  }}
                >
                  {isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 15,
                        color: "#fff",
                      }}
                    >
                      Send enquiry
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
