import { Platform, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { isAppleAuthAvailable } from "@/lib/appleAuth";

interface SocialSignInButtonsProps {
  onGoogle: () => void;
  onApple?: () => void;
  loading?: boolean;
}

export function SocialSignInButtons({ onGoogle, onApple, loading }: SocialSignInButtonsProps) {
  const showApple = isAppleAuthAvailable();

  return (
    <View className="gap-3">
      <Button
        variant="outline"
        size="md"
        onPress={onGoogle}
        loading={loading}
        disabled={loading}
        accessibilityLabel="Continue with Google"
      >
        Continue with Google
      </Button>

      {showApple && onApple && (
        <Button
          variant="outline"
          size="md"
          onPress={onApple}
          loading={loading}
          disabled={loading}
          accessibilityLabel="Sign in with Apple"
        >
          Sign in with Apple
        </Button>
      )}
    </View>
  );
}
