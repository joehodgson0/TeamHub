import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { View, Text, ActivityIndicator } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#222" />
        <Text className="mt-4 text-muted-foreground">Loading TeamHub...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/landing" />;
  }

  if (user && user.roles?.length === 0) {
    return <Redirect href="/(auth)/role-selection" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
