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
                variant="outline"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-google-login"
                className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium flex items-center justify-center gap-3 py-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
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