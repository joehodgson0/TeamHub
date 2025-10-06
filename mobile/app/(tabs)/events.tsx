import { View, Text, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function Events() {
  return (
    <ScrollView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <View className="px-4 py-6">
        <Text className="text-3xl font-bold text-foreground mb-6">Events</Text>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Event calendar and management features will appear here
            </CardDescription>
          </CardHeader>
        </Card>
      </View>
    </ScrollView>
  );
}
