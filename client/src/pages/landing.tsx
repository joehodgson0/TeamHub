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

          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Get Started</h2>
              <p className="text-sm text-muted-foreground">
                Choose how you'd like to sign in to TeamHub
              </p>
            </div>
            
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-google-login"
                className="w-full"
              >
                Sign In with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = '/login'}
                data-testid="button-username-login"
                className="w-full"
              >
                Sign In with Email
              </Button>
              
              <Button 
                size="lg" 
                variant="ghost"
                onClick={() => window.location.href = '/register'}
                data-testid="button-register"
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}