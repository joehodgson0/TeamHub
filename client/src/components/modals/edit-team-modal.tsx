import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTeamSchema, type CreateTeam, type Team } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface EditTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

const ageGroups = [
  "U7", "U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U21"
];

export default function EditTeamModal({ open, onOpenChange, team }: EditTeamModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateTeam>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      ageGroup: "U12",
    },
  });

  // Reset form when team changes
  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name || "",
        ageGroup: team.ageGroup || "U12",
      });
    }
  }, [team, form]);

  const onSubmit = async (data: CreateTeam) => {
    if (!user || !user.clubId || !team) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid team or user data.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          ageGroup: data.ageGroup,
        }),
        credentials: "include",
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Team Updated Successfully",
          description: `${data.name} has been updated.`,
        });

        form.reset();
        onOpenChange(false);
        
        // Invalidate and refetch teams query
        queryClient.invalidateQueries({
          queryKey: ['/api/teams/club', user.clubId]
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update team",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update team. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-edit-team">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-edit-team">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter team name"
                      data-testid="input-team-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Group</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} data-testid="select-age-group">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ageGroups.map((ageGroup) => (
                        <SelectItem key={ageGroup} value={ageGroup}>
                          Under {ageGroup.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
                data-testid="button-update"
              >
                {isLoading ? "Updating..." : "Update Team"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}