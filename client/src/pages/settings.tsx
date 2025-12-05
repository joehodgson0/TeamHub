import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user, updateUserRoles, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data has been deleted.",
      });

      // Redirect to landing page
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete account. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
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

      {/* Danger Zone */}
      <Card className="border-destructive" data-testid="card-danger-zone">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            data-testid="button-delete-account"
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent data-testid="dialog-delete-account">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data including:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Your profile and account information</li>
                <li>All dependent players you added</li>
                <li>All posts you created</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground"
            data-testid="button-confirm-delete"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete Account"}
          </AlertDialogAction>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
