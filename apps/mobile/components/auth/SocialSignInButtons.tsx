import { Alert, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { isAppleAuthAvailable } from "@/lib/appleAuth";
import { useTheme } from "@/hooks/useTheme";

interface SocialSignInButtonsProps {
  onGoogle: () => void;
  onApple?: () => void;
  loading?: boolean;
}

function handleAppleComingSoon() {
  Alert.alert(
    "Coming soon",
    "Apple Sign-In will be available in a future update. Please use email or Google sign-in."
  );
}

export function SocialSignInButtons({ onGoogle, onApple, loading }: SocialSignInButtonsProps) {
  const showApple = isAppleAuthAvailable();
  const { isDark } = useTheme();
  const iconColor = isDark ? "rgba(255,255,255,0.70)" : "rgba(29,58,46,0.70)";

  return (
    <View className="gap-3">
      <Button
        variant="outline"
        size="md"
        onPress={onGoogle}
        loading={loading}
        disabled={loading}
        accessibilityLabel="Continue with Google"
        icon={<Ionicons name="logo-google" size={18} color={iconColor} />}
      >
        Continue with Google
      </Button>

      {showApple && (
        <Button
          variant="outline"
          size="md"
          onPress={onApple ?? handleAppleComingSoon}
          loading={loading}
          disabled={loading}
          accessibilityLabel="Sign in with Apple"
          icon={<Ionicons name="logo-apple" size={18} color={iconColor} />}
        >
          Sign in with Apple
        </Button>
      )}
    </View>
  );
}
