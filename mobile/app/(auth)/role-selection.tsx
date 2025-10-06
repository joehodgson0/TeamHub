import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RoleSelection() {
  const router = useRouter();
  const { user, updateUserRoles } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<("coach" | "parent")[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleRole = (role: "coach" | "parent") => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleContinue = async () => {
    if (selectedRoles.length === 0) {
      setError("Please select at least one role");
      return;
    }

    setLoading(true);
    setError("");
    
    const result = await updateUserRoles(user?.id || "", selectedRoles);
    
    if (result.success) {
      router.replace("/");
    } else {
      setError(result.error || "Failed to update roles");
    }
    
    setLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <View className="flex-1 px-4 py-16">
        <View className="space-y-6 max-w-md w-full mx-auto">
          <View className="space-y-2 items-center">
            <Text className="text-3xl font-bold text-foreground">Choose Your Role</Text>
            <Text className="text-muted-foreground text-center">
              Select how you'll be using TeamHub. You can select multiple roles.
            </Text>
          </View>

          <View className="space-y-4">
            <TouchableOpacity onPress={() => toggleRole("coach")}>
              <Card className={`p-6 ${selectedRoles.includes("coach") ? "border-primary border-2" : ""}`}>
                <Text className="text-xl font-bold text-foreground mb-2">Coach/Manager</Text>
                <Text className="text-muted-foreground">
                  Create and manage teams, schedule events, track player performance, and communicate with parents.
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => toggleRole("parent")}>
              <Card className={`p-6 ${selectedRoles.includes("parent") ? "border-primary border-2" : ""}`}>
                <Text className="text-xl font-bold text-foreground mb-2">Parent/Guardian</Text>
                <Text className="text-muted-foreground">
                  Add your children as players, view team schedules, manage availability, and stay updated with team news.
                </Text>
              </Card>
            </TouchableOpacity>

            {error && (
              <Text className="text-destructive text-sm text-center">{error}</Text>
            )}

            <Button 
              onPress={handleContinue}
              loading={loading}
              disabled={selectedRoles.length === 0}
              className="w-full mt-4"
            >
              Continue
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
