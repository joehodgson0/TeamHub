import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", { 
        email, 
        password, 
        firstName: firstName || undefined,
        lastName: lastName || undefined
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user-session"] });
      router.replace("/");
    },
    onError: (error: any) => {
      setErrors({ general: error.message || "Registration failed" });
    },
  });

  const handleRegister = () => {
    setErrors({});
    
    if (!email) {
      setErrors(prev => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!password || password.length < 8) {
      setErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }));
      return;
    }

    registerMutation.mutate();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-background">
        <StatusBar style="dark" />
        <View className="flex-1 px-4 py-16">
          <View className="space-y-6 max-w-md w-full mx-auto">
            <View className="space-y-2 items-center">
              <Text className="text-3xl font-bold text-foreground">Create Account</Text>
              <Text className="text-muted-foreground">Join TeamHub to manage your teams</Text>
            </View>

            <View className="space-y-4">
              <Input
                label="First Name (optional)"
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
              />

              <Input
                label="Last Name (optional)"
                placeholder="Smith"
                value={lastName}
                onChangeText={setLastName}
              />

              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
              />

              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
              />

              {errors.general && (
                <Text className="text-destructive text-sm">{errors.general}</Text>
              )}

              <Button 
                onPress={handleRegister}
                loading={registerMutation.isPending}
                className="w-full"
              >
                Create Account
              </Button>

              <View className="flex-row items-center justify-center">
                <Text className="text-muted-foreground">Already have an account? </Text>
                <Link href="/(auth)/login">
                  <Text className="text-primary font-medium">Sign in</Text>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
