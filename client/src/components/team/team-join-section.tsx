import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addPlayerSchema, type AddPlayer } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Info } from "lucide-react";

export default function TeamJoinSection() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const canJoinTeam = hasRole("parent");

  const joinTeamMutation = useMutation({
    mutationFn: async (data: { teamCode: string; playerName: string; dateOfBirth: string; parentId: string }) => {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players/parent'] });
      toast({
        title: "Successfully Joined Team!",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Join Team",
        description: error.message,
      });
    },
  });

  const form = useForm<AddPlayer>({
    resolver: zodResolver(addPlayerSchema),
    defaultValues: {
      name: "",
      dateOfBirth: new Date(),
      teamCode: "",
    },
  });

  const onSubmit = async (data: AddPlayer) => {
    if (!user) return;

    try {
      await joinTeamMutation.mutateAsync({
        teamCode: data.teamCode,
        playerName: data.name,
        dateOfBirth: data.dateOfBirth.toISOString(),
        parentId: user.id,
      });

      form.reset();
    } catch (error) {
      // Error handling is done in the mutation's onError callback
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your child's name"
                          data-testid="input-player-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-date-of-birth"
                          value={field.value ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  disabled={joinTeamMutation.isPending}
                  data-testid="button-join-team"
                >
                  {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
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
