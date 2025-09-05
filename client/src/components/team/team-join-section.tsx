import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teamAssociationSchema, type TeamAssociation } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Info } from "lucide-react";

export default function TeamJoinSection() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const canJoinTeam = hasRole("parent");

  const form = useForm<TeamAssociation>({
    resolver: zodResolver(teamAssociationSchema),
    defaultValues: {
      teamCode: "",
    },
  });

  const onSubmit = async (data: TeamAssociation) => {
    if (!user) return;

    setIsLoading(true);

    try {
      if (!data.teamCode.startsWith("1")) {
        toast({
          variant: "destructive",
          title: "Invalid Team Code",
          description: "No team found with that code",
        });
        return;
      }

      // TODO: Replace with API call to validate team code
      // For now, show success message
      toast({
        title: "Team Join Request Submitted",
        description: "Your request to join the team has been submitted.",
      });

      // In a real app, this would create a player association request
      toast({
        title: "Team Association Request Sent",
        description: `Your request to join ${team.name} has been sent to the team manager.`,
      });

      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card data-testid="card-join-team">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="w-5 h-5 text-primary" />
          <span>Join Team</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canJoinTeam ? (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-join-team">
                <FormField
                  control={form.control}
                  name="teamCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 8-character team code"
                          data-testid="input-team-code"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-join-team"
                >
                  {isLoading ? "Joining..." : "Join Team"}
                </Button>
              </form>
            </Form>

            <Alert data-testid="demo-info">
              <Info className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium text-xs">Demo Information</p>
                  <p className="text-xs">Team codes starting with '1' are valid for demo purposes</p>
                  <p className="text-xs">Example: "1DEF6789" for U12 Eagles</p>
                </div>
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Team joining is available for parents/guardians</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
