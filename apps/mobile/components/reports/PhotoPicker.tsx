import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useTheme } from "@/hooks/useTheme";

interface UploadedPhoto {
  localUri: string;
  mediaId: string;
  cdnUrl: string;
}

interface Props {
  photos: UploadedPhoto[];
  onAdd: (localUri: string, mimeType: string) => Promise<void>;
  onRemove: (mediaId: string) => void;
  uploading: boolean;
  maxPhotos?: number;
}

export function PhotoPicker({ photos, onAdd, onRemove, uploading, maxPhotos = 3 }: Props) {
  const { colors, isDark } = useTheme();

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    // Resize to max 1920px on the long side
    const manipResult = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1920 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );

    await onAdd(manipResult.uri, "image/jpeg");
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {photos.map((p) => (
          <View key={p.mediaId} style={styles.thumbWrap}>
            <Image source={{ uri: p.localUri }} style={styles.thumb} contentFit="cover" />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onRemove(p.mediaId)}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < maxPhotos && (
          <TouchableOpacity
            style={[
              styles.addBtn,
              {
                borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              },
            ]}
            onPress={pickPhoto}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            {uploading ? (
              <ActivityIndicator color="#E8702A" size="small" />
            ) : (
              <Text style={[styles.addIcon, { color: colors.textMuted }]}>+</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {photos.length}/{maxPhotos} photos · JPEG/PNG/WebP · max 5 MB each
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  thumbWrap: { position: "relative" },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  addBtn: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: { fontSize: 28, lineHeight: 32 },
  hint: { fontSize: 11 },
});
