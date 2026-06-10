import { SafeAreaView, type SafeAreaViewProps } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";

interface SafeAreaProps extends SafeAreaViewProps {
  children: React.ReactNode;
}

export function SafeArea({ children, style, ...props }: SafeAreaProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      {...props}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    >
      {children}
    </SafeAreaView>
  );
}
