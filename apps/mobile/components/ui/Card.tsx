import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <View
      {...props}
      className={`bg-surface rounded-2xl border border-white/10 p-5 ${className}`}
    >
      {children}
    </View>
  );
}
