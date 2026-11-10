import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAppleMapsDirectionsUrl, getGoogleMapsDirectionsUrl } from "@shared/map-directions";

async function openMap(url: string, mapName: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Could not open maps", `Unable to open ${mapName} for this location.`);
  }
}

export function LocationMapLinks({ location }: { location: string }) {
  const appleMapsUrl = getAppleMapsDirectionsUrl(location);
  const googleMapsUrl = getGoogleMapsDirectionsUrl(location);
  if (!appleMapsUrl || !googleMapsUrl) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="link"
        accessibilityLabel={`Get directions to ${location} with Apple Maps`}
        onPress={() => void openMap(appleMapsUrl, "Apple Maps")}
      >
        <Text style={styles.link}>Apple Maps</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="link"
        accessibilityLabel={`Get directions to ${location} with Google Maps`}
        onPress={() => void openMap(googleMapsUrl, "Google Maps")}
      >
        <Text style={styles.link}>Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 4,
  },
  link: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
