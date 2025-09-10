import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  const { user, updateUserRoles } = useAuth();
  const { toast } = useToast();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Array<"coach" | "parent">>([]);

  // Initialize selected roles when user data loads
  useEffect(() => {
    if (user?.roles) {
      setSelectedRoles(user.roles);
    }
  }, [user?.roles]);

  const onUpdateProfile = async () => {
    if (!user) return;

    setIsLoadingProfile(true);
    try {
      await updateUserRoles(user.id, selectedRoles);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const toggleRole = (role: "coach" | "parent") => {
    setSelectedRoles(currentRoles => 
      currentRoles.includes(role)
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role]
    );
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <h1 className="text-2xl font-bold" data-testid="heading-settings">Settings</h1>
      
      {/* Profile Settings */}
      <Card data-testid="card-profile-settings">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="form-profile">
            <div className="space-y-3">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role</label>
              <div className="space-y-2">
                <div
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRoles.includes("coach") 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted"
                  }`}
                  onClick={() => toggleRole("coach")}
                  data-testid="role-coach"
                >
                  <Checkbox
                    checked={selectedRoles.includes("coach")}
                    onCheckedChange={() => {}}
                  />
                  <span className="text-sm">Coach/Manager</span>
                </div>
                <div
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRoles.includes("parent") 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted"
                  }`}
                  onClick={() => toggleRole("parent")}
                  data-testid="role-parent"
                >
                  <Checkbox
                    checked={selectedRoles.includes("parent")}
                    onCheckedChange={() => {}}
                  />
                  <span className="text-sm">Parent/Guardian</span>
                </div>
              </div>
            </div>

            <Button
              onClick={onUpdateProfile}
              disabled={isLoadingProfile}
              data-testid="button-update-profile"
            >
              {isLoadingProfile ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
