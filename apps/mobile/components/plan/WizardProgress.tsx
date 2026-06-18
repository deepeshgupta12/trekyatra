import { View, StyleSheet } from "react-native";

interface Props {
  current: number; // 1-based: which step is active
  total: number;
}

export function WizardProgress({ current, total }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i + 1 < current;
        const active = i + 1 === current;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              done && styles.dotDone,
              active && styles.dotActive,
              !done && !active && styles.dotPending,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { borderRadius: 99 },
  dotDone: { width: 8, height: 8, backgroundColor: "#E8702A" },
  dotActive: { width: 10, height: 10, backgroundColor: "#E8702A" },
  dotPending: { width: 8, height: 8, backgroundColor: "rgba(255,255,255,0.18)" },
});
