import { View, Text, ScrollView } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Users, Trophy, Calendar, MessageSquare } from "lucide-react-native";

export default function Landing() {
  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-primary/10 to-secondary/10">
      <StatusBar style="dark" />
      <View className="container mx-auto px-4 py-16">
        <View className="items-center space-y-8">
          <View className="space-y-4 items-center">
            <Text className="text-4xl font-bold tracking-tight text-primary text-center">
              Welcome to TeamHub
            </Text>
            <Text className="text-xl text-muted-foreground text-center max-w-2xl">
              The complete sports team management platform for coaches and parents
            </Text>
          </View>

          <View className="w-full space-y-4">
            <Card>
              <CardHeader className="items-center">
                <Users color="#222" size={32} />
                <CardTitle className="text-lg text-center mt-2">Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Organize players, track attendance, and manage team rosters
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="items-center">
                <Calendar color="#222" size={32} />
                <CardTitle className="text-lg text-center mt-2">Event Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Schedule matches, training sessions, and track results
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="items-center">
                <Trophy color="#222" size={32} />
                <CardTitle className="text-lg text-center mt-2">Match Results</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Record scores, player statistics, and team performance
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="items-center">
                <MessageSquare color="#222" size={32} />
                <CardTitle className="text-lg text-center mt-2">Team Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Share updates, coordinate events, and stay connected
                </CardDescription>
              </CardContent>
            </Card>
          </View>

          <View className="w-full space-y-3 mt-8">
            <Link href="/(auth)/login" asChild>
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/(auth)/register" asChild>
              <Button variant="outline" className="w-full">Create Account</Button>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
