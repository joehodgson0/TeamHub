import { View, Text, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function Posts() {
  return (
    <ScrollView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <View className="px-4 py-6">
        <Text className="text-3xl font-bold text-foreground mb-6">Posts</Text>

        <Card>
          <CardHeader>
            <CardTitle>Team Posts</CardTitle>
            <CardDescription>
              Team announcements and updates will appear here
            </CardDescription>
          </CardHeader>
        </Card>
      </View>
    </ScrollView>
  );
}
