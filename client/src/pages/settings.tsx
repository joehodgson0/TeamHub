import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ProfileSettings {
  name: string;
  roles: Array<"coach" | "parent">;
}


export default function Settings() {
  const { user, updateUserRoles } = useAuth();
  const { toast } = useToast();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const profileForm = useForm<ProfileSettings>({
    defaultValues: {
      name: user?.name || "",
      roles: user?.roles || [],
    },
  });


  const onUpdateProfile = async (data: ProfileSettings) => {
    if (!user) return;

    setIsLoadingProfile(true);
    try {
      // In a real app, this would update the user profile on the server
      await updateUserRoles(user.id, data.roles);
      
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
    const currentRoles = profileForm.getValues("roles");
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    profileForm.setValue("roles", newRoles);
  };

  const selectedRoles = profileForm.watch("roles");

  return (
    <div className="space-y-6" data-testid="settings-page">
      <h1 className="text-2xl font-bold" data-testid="heading-settings">Settings</h1>
      
      {/* Profile Settings */}
      <Card data-testid="card-profile-settings">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4" data-testid="form-profile">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        data-testid="input-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Role</FormLabel>
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
                    />
                    <span className="text-sm">Parent/Guardian</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoadingProfile}
                data-testid="button-update-profile"
              >
                {isLoadingProfile ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
