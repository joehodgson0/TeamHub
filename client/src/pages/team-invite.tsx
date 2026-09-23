import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InvitationResponse = {
  success: boolean;
  invitation: {
    email: string;
    role: "parent" | "coach";
    team: { id: string; name: string; ageGroup: string };
    expiresAt: string;
  };
};

export default function TeamInvite() {
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") || "";
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [dependentName, setDependentName] = useState("");
  const [dependentDateOfBirth, setDependentDateOfBirth] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading, error: loadError } = useQuery<InvitationResponse>({
    queryKey: ["/api/team-invitations", token],
    queryFn: async () => {
      const response = await fetch(`/api/team-invitations/details?token=${encodeURIComponent(token)}`, { credentials: "include" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load invitation");
      return result;
    },
    enabled: Boolean(token),
    retry: false,
  });

  const acceptInvitation = async () => {
    setIsAccepting(true);
    setError("");
    try {
      const response = await apiRequest(
        "POST",
        "/api/team-invitations/accept",
        data?.invitation.role === "parent" ? { token, dependentName, dependentDateOfBirth } : { token },
      );
      const result = await response.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user-session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams/club"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players/parent"] });
      navigate(result.role === "parent" ? "/dependents" : "/team");
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept invitation");
    } finally {
      setIsAccepting(false);
    }
  };

  const authQuery = `invite=${encodeURIComponent(token)}`;
  const invitation = data?.invitation;
  const displayedError = error || (loadError instanceof Error ? loadError.message : "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Team invitation</CardTitle>
          <CardDescription>
            {isLoading ? "Loading invitation…" : invitation ? `Join ${invitation.team.name} (${invitation.team.ageGroup}) as a ${invitation.role}.` : "Unable to load this invitation."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayedError && <p className="text-sm text-destructive">{displayedError}</p>}

          {invitation && !isAuthenticated && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign in or create an account using <strong>{invitation.email}</strong> to continue.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/login?${authQuery}`}><Button className="w-full">Sign in</Button></Link>
                <Link href={`/register?${authQuery}`}><Button variant="outline" className="w-full">Create account</Button></Link>
              </div>
            </div>
          )}

          {invitation && isAuthenticated && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Signed in as <strong>{user?.email}</strong>. This invite was sent to <strong>{invitation.email}</strong>.
              </p>
              {invitation.role === "parent" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="dependent-name">Dependent name</Label>
                    <Input id="dependent-name" value={dependentName} onChange={(event) => setDependentName(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dependent-dob">Date of birth</Label>
                    <Input id="dependent-dob" type="date" value={dependentDateOfBirth} onChange={(event) => setDependentDateOfBirth(event.target.value)} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If this dependent already exists on the team, your account will be linked instead of creating a duplicate.
                  </p>
                </>
              )}
              <Button
                className="w-full"
                disabled={isAccepting || (invitation.role === "parent" && (!dependentName.trim() || !dependentDateOfBirth))}
                onClick={acceptInvitation}
              >
                {isAccepting ? "Accepting…" : `Join ${invitation.team.name}`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
