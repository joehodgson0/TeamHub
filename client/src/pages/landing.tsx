// Landing page for Replit Auth - referenced from javascript_log_in_with_replit blueprint
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Calendar, MessageSquare } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-primary">
              Welcome to TeamHub
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The complete sports team management platform for coaches and parents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-12">
            <Card>
              <CardHeader className="text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Organize players, track attendance, and manage team rosters
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Event Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Schedule matches, training sessions, and track results
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Match Results</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Record scores, player statistics, and team performance
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Share announcements, kit requests, and team updates
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Sign In with Google
            </Button>
            <p className="text-sm text-muted-foreground">
              Connect with your Google account to get started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}