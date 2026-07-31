import { useRef, useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, FlatList, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface TrekGalleryProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

/**
 * STEP-M30 N08/N09 — full-screen trek photo gallery. Sources: hero + route-map + trip-report
 * photos (owner decision). Horizontal paging; each image pinch-zooms (iOS ScrollView zoom).
 */
export function TrekGallery({ visible, images, initialIndex = 0, onClose }: TrekGalleryProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<string>>(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  if (images.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(uri, i) => `${i}-${uri}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
          renderItem={({ item }) => (
            <ScrollView
              style={{ width: SCREEN_W, height: SCREEN_H }}
              contentContainerStyle={styles.zoomContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              centerContent
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <Image source={{ uri: item }} style={styles.image} contentFit="contain" transition={150} />
            </ScrollView>
          )}
        />

        {/* Close */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 8 }]}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Close gallery"
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Index indicator */}
        {images.length > 1 && (
          <View style={[styles.counter, { bottom: insets.bottom + 20 }]}>
            <Text style={styles.counterText}>{index + 1} / {images.length}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)" },
  zoomContent: { width: SCREEN_W, height: SCREEN_H, alignItems: "center", justifyContent: "center" },
  image: { width: SCREEN_W, height: SCREEN_H * 0.8 },
  closeBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  counterText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
