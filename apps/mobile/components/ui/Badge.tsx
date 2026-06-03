import { View, Text } from "react-native";

type BadgeVariant =
  | "live"
  | "ready"
  | "in-progress"
  | "pending"
  | "failed"
  | "warning"
  | "info"
  | "default";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  live:          { container: "bg-pine/10 border border-pine/20",       text: "text-pine" },
  ready:         { container: "bg-pine/10 border border-pine/20",       text: "text-pine" },
  "in-progress": { container: "bg-blue-400/10 border border-blue-400/20", text: "text-blue-400" },
  pending:       { container: "bg-white/5 border border-white/10",      text: "text-white/40" },
  failed:        { container: "bg-red-400/10 border border-red-400/20", text: "text-red-400" },
  warning:       { container: "bg-amber-400/10 border border-amber-400/20", text: "text-amber-400" },
  info:          { container: "bg-blue-400/10 border border-blue-400/20", text: "text-blue-400" },
  default:       { container: "bg-white/5 border border-white/10",      text: "text-white/50" },
};

export function Badge({ label, variant = "default" }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <View className={`rounded-full px-2.5 py-1 self-start ${style.container}`}>
      <Text
        className={`text-xs font-medium ${style.text}`}
        style={{ fontFamily: "Inter_500Medium" }}
      >
        {label}
      </Text>
    </View>
  );
}
