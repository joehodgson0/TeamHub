import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { clubAssociationSchema, type ClubAssociation } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, Info, CheckCircle, XCircle } from "lucide-react";

export default function Club() {
  const { user, associateWithClub } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch club data from database
  const { data: clubData, isLoading: clubLoading } = useQuery({
    queryKey: ["/api/clubs", user?.clubId],
    enabled: !!user?.clubId,
  });
  
  const club = clubData?.club;

  const form = useForm<ClubAssociation>({
    resolver: zodResolver(clubAssociationSchema),
    defaultValues: {
      clubCode: "",
    },
  });

  const onSubmit = async (data: ClubAssociation) => {
    if (!user) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const result = await associateWithClub(user.id, data.clubCode);
      
      if (result.success) {
        setFeedback({
          type: "success",
          message: `Successfully joined ${result.clubName}!`
        });
        form.reset();
        toast({
          title: "Club Association Successful",
          description: `You have joined ${result.clubName}`,
        });
      } else {
        setFeedback({
          type: "error",
          message: result.error || "Failed to join club"
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: "An unexpected error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="club-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="heading-club">Club Management</h1>
      </div>

      {!club ? (
        /* Show Join Club Section when not in a club */
        <div className="max-w-md mx-auto">
          <Card data-testid="card-join-club">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-primary" />
                <span>Join Club</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-join-club">
                  <FormField
                    control={form.control}
                    name="clubCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Club Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 8-character club code"
                            data-testid="input-club-code"
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
                    data-testid="button-join-club"
                  >
                    {isLoading ? "Joining..." : "Join Club"}
                  </Button>
                </form>
              </Form>

              {feedback && (
                <Alert className={feedback.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"} data-testid="club-feedback">
                  <div className="flex items-center space-x-2">
                    {feedback.type === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <AlertDescription className={feedback.type === "success" ? "text-green-800" : "text-red-800"}>
                      {feedback.message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <Alert data-testid="demo-info">
                <Info className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Demo Information</p>
                    <ul className="text-sm space-y-1">
                      <li>• Club: <strong>Hilly Fielders FC</strong></li>
                      <li>• Valid codes start with "1" (e.g., "1ABC2345")</li>
                      <li>• Invalid codes show error message</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Show Current Club Section when in a club */
        <div className="max-w-2xl mx-auto">
          <Card data-testid="card-current-club">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-primary" />
                <span>Current Club</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-primary/10 rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold" data-testid="text-club-name">{club.name}</h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-club-established">
                    Established {club.established}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Teams</span>
                  <span className="font-medium" data-testid="text-total-teams">{club.totalTeams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Players</span>
                  <span className="font-medium" data-testid="text-total-players">{club.totalPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Role</span>
                  <span className="font-medium" data-testid="text-user-role">
                    {user?.roles.includes("coach") ? "Team Manager" : "Parent/Guardian"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
