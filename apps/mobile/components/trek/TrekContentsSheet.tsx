import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export interface ContentsHeading {
  id: string;
  level: 2 | 3;
  content: string;
}

interface TrekContentsSheetProps {
  visible: boolean;
  headings: ContentsHeading[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function TrekContentsSheet({ visible, headings, onSelect, onClose }: TrekContentsSheetProps) {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: isDark ? "#16181f" : colors.surface },
        ]}
      >
        <View style={styles.handle} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Contents</Text>
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {headings.map((heading) => (
            <TouchableOpacity
              key={heading.id}
              style={[styles.row, { paddingLeft: heading.level === 3 ? 28 : 16 }]}
              onPress={() => onSelect(heading.id)}
            >
              <Text
                style={[
                  heading.level === 2 ? styles.h2 : styles.h3,
                  { color: colors.textPrimary },
                ]}
                numberOfLines={2}
              >
                {heading.content}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: "65%",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(150,150,150,0.4)",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 4,
  },
  row: {
    paddingVertical: 12,
    paddingRight: 16,
  },
  h2: {
    fontSize: 15,
    fontWeight: "600",
  },
  h3: {
    fontSize: 13,
    fontWeight: "500",
  },
});
