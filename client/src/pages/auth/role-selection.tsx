import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleSelectionSchema, type RoleSelection } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Users, Clipboard, Heart } from "lucide-react";

export default function RoleSelection() {
  const [, setLocation] = useLocation();
  const { user, updateUserRoles } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RoleSelection>({
    resolver: zodResolver(roleSelectionSchema),
    defaultValues: {
      roles: [],
    },
  });

  const selectedRoles = form.watch("roles");

  const onSubmit = async (data: RoleSelection) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not found. Please try registering again.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateUserRoles(user.id, data.roles);
      
      if (result.success) {
        toast({
          title: "Welcome to TeamHub!",
          description: "Your account has been set up successfully.",
        });
        setLocation("/");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update your roles.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRole = (role: "coach" | "parent") => {
    const currentRoles = selectedRoles;
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    form.setValue("roles", newRoles);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="text-center space-y-2">
            <Users className="w-12 h-12 text-primary mx-auto" />
            <CardTitle className="text-2xl">Select Your Role</CardTitle>
            <CardDescription>
              Choose how you'll be using TeamHub (you can select multiple roles)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-role-selection">
                <FormField
                  control={form.control}
                  name="roles"
                  render={() => (
                    <FormItem>
                      <div className="space-y-3">
                        <div 
                          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedRoles.includes("coach") 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:bg-muted"
                          }`}
                          onClick={() => toggleRole("coach")}
                          data-testid="role-coach"
                        >
                          <Checkbox
                            checked={selectedRoles.includes("coach")}
                            onChange={() => toggleRole("coach")}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Clipboard className="w-5 h-5 text-primary" />
                              <div>
                                <h3 className="font-medium">Coach/Manager</h3>
                                <p className="text-sm text-muted-foreground">
                                  Manage teams, schedule fixtures, and track performance
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div 
                          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedRoles.includes("parent") 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:bg-muted"
                          }`}
                          onClick={() => toggleRole("parent")}
                          data-testid="role-parent"
                        >
                          <Checkbox
                            checked={selectedRoles.includes("parent")}
                            onChange={() => toggleRole("parent")}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Heart className="w-5 h-5 text-primary" />
                              <div>
                                <h3 className="font-medium">Parent/Guardian</h3>
                                <p className="text-sm text-muted-foreground">
                                  Follow your child's team activities and events
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || selectedRoles.length === 0}
                  data-testid="button-continue"
                >
                  {isLoading ? "Setting up..." : "Continue to Dashboard"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
