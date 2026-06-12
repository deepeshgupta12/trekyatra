import { StyleSheet } from "react-native";
import { SearchBar, SearchBarWrapper } from "@/components/browse/SearchBar";

export function HomeSearchBar() {
  return (
    <SearchBarWrapper>
      <SearchBar style={styles.bar} />
    </SearchBarWrapper>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginTop: -24,
  },
});
