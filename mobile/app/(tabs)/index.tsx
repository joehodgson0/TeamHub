import { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.timeContainer}>
        <ThemedText style={styles.timeText}>
          {formatTime(currentTime)}
        </ThemedText>
        <ThemedText style={styles.dateText}>
          {formatDate(currentTime)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timeContainer: {
    alignItems: "center",
    gap: 16,
  },
  timeText: {
    fontSize: 64,
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 24,
    opacity: 0.8,
  },
});
