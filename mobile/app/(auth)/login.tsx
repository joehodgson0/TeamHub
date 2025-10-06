import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user-session"] });
      router.replace("/");
    },
    onError: (error: any) => {
      setErrors({ general: error.message || "Invalid email or password" });
    },
  });

  const handleLogin = () => {
    setErrors({});
    
    if (!email) {
      setErrors(prev => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!password) {
      setErrors(prev => ({ ...prev, password: "Password is required" }));
      return;
    }

    loginMutation.mutate();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-background">
        <StatusBar style="dark" />
        <View className="flex-1 px-4 py-16 justify-center">
          <View className="space-y-6 max-w-md w-full mx-auto">
            <View className="space-y-2 items-center">
              <Text className="text-3xl font-bold text-foreground">Sign In</Text>
              <Text className="text-muted-foreground">Enter your credentials to access TeamHub</Text>
            </View>

            <View className="space-y-4">
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
                onPress={handleLogin}
                loading={loginMutation.isPending}
                className="w-full"
              >
                Sign In
              </Button>

              <View className="flex-row items-center justify-center">
                <Text className="text-muted-foreground">Don't have an account? </Text>
                <Link href="/(auth)/register">
                  <Text className="text-primary font-medium">Sign up</Text>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
