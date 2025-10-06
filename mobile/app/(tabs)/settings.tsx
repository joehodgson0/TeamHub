import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function Settings() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/landing");
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <View className="px-4 py-6">
        <Text className="text-3xl font-bold text-foreground mb-6">Settings</Text>

        <View className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                {user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Text className="text-muted-foreground">
                Roles: {user?.roles?.join(", ") || "None"}
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Manage your account settings
              </CardDescription>
            </CardHeader>
          </Card>

          <Button variant="destructive" onPress={handleLogout} className="w-full mt-4">
            Sign Out
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
