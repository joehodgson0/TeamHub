import { View, Text, StyleSheet } from 'react-native';

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function WidgetCard({ title, children, emptyMessage = "No data", isEmpty = false }: WidgetCardProps) {
  return (
    <View style={styles.widget}>
      <Text style={styles.widgetTitle}>{title}</Text>
      {isEmpty ? (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    marginBottom: 24,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 12,
  },
});
