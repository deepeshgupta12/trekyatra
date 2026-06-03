import { SafeAreaView, type SafeAreaViewProps } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";

interface SafeAreaProps extends SafeAreaViewProps {
  children: React.ReactNode;
}

export function SafeArea({ children, style, ...props }: SafeAreaProps) {
  return (
    <SafeAreaView
      {...props}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    >
      {children}
    </SafeAreaView>
  );
}
