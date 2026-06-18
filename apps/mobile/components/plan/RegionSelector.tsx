import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const REGIONS = [
  { value: "Uttarakhand", label: "Uttarakhand", hint: "Kedarkantha, Roopkund, Valley of Flowers" },
  { value: "Himachal Pradesh", label: "Himachal Pradesh", hint: "Hampta Pass, Pin Parvati, Kheerganga" },
  { value: "Jammu & Kashmir", label: "Jammu & Kashmir", hint: "Tarsar Marsar, Kashmir Great Lakes" },
  { value: "Ladakh", label: "Ladakh", hint: "Markha Valley, Stok Kangri, Nubra" },
  { value: "Maharashtra", label: "Maharashtra", hint: "Harishchandragad, Rajmachi, Kalsubai" },
  { value: "West Bengal & Sikkim", label: "West Bengal & Sikkim", hint: "Sandakphu, Goecha La" },
];

const ANY = "any";

interface Props {
  value: string | null;
  onChange: (v: string | null) => void;
}

export function RegionSelector({ value, onChange }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.root}>
      {/* Any region option */}
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: value === null ? "rgba(232,112,42,0.15)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
            borderColor: value === null ? "#E8702A" : isDark ? "rgba(255,255,255,0.1)" : "rgba(29,58,46,0.12)",
          },
        ]}
        onPress={() => onChange(null)}
        activeOpacity={0.75}
      >
        <View style={styles.cardLeft}>
          <Text style={[styles.cardLabel, { color: value === null ? "#E8702A" : colors.textPrimary }]}>Any region</Text>
          <Text style={[styles.cardHint, { color: colors.textMuted }]}>Show me all of India</Text>
        </View>
        {value === null && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
      </TouchableOpacity>

      {REGIONS.map((r) => {
        const active = value === r.value;
        return (
          <TouchableOpacity
            key={r.value}
            style={[
              styles.card,
              {
                backgroundColor: active ? "rgba(232,112,42,0.15)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                borderColor: active ? "#E8702A" : isDark ? "rgba(255,255,255,0.1)" : "rgba(29,58,46,0.12)",
              },
            ]}
            onPress={() => onChange(r.value)}
            activeOpacity={0.75}
          >
            <View style={styles.cardLeft}>
              <Text style={[styles.cardLabel, { color: active ? "#E8702A" : colors.textPrimary }]}>{r.label}</Text>
              <Text style={[styles.cardHint, { color: colors.textMuted }]} numberOfLines={1}>{r.hint}</Text>
            </View>
            {active && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  card: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { flex: 1, gap: 2 },
  cardLabel: { fontSize: 14, fontWeight: "700" },
  cardHint: { fontSize: 12 },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#E8702A", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  checkText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
