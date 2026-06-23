import { View, StyleSheet } from "react-native";
import { SearchBar, SearchBarWrapper } from "@/components/browse/SearchBar";

// Removed the negative marginTop that floated the bar over the hero image,
// making it hard to see against bright sky/landscape photos.
export function HomeSearchBar() {
  return (
    <View style={styles.container}>
      <SearchBarWrapper>
        <SearchBar />
      </SearchBarWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 4,
  },
});
