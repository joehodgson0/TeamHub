import { View, Text, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function Dashboard() {
  const { user, isCoach, isParent } = useAuth();

  return (
    <ScrollView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <View className="px-4 py-6">
        <Text className="text-3xl font-bold text-foreground mb-2">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
        </Text>
        <Text className="text-muted-foreground mb-6">
          {isCoach && isParent && "Managing teams and following players"}
          {isCoach && !isParent && "Managing your teams"}
          {!isCoach && isParent && "Following your players"}
        </Text>

        <View className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>
                Your team management dashboard will appear here
              </CardDescription>
            </CardHeader>
          </Card>

          {isCoach && (
            <Card>
              <CardHeader>
                <CardTitle>Coach Features</CardTitle>
                <CardDescription>
                  Create teams, schedule events, and manage players
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {isParent && (
            <Card>
              <CardHeader>
                <CardTitle>Parent Features</CardTitle>
                <CardDescription>
                  Add dependents, view schedules, and manage availability
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
