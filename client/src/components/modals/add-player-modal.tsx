import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addPlayerSchema, type AddPlayer } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AddPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPlayerModal({ open, onOpenChange }: AddPlayerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddPlayer>({
    resolver: zodResolver(addPlayerSchema),
    defaultValues: {
      name: "",
      dateOfBirth: new Date(),
      teamCode: "",
    },
  });

  const onSubmit = async (data: AddPlayer) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to add players.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          dateOfBirth: data.dateOfBirth,
          teamCode: data.teamCode,
          parentId: user.id,
        }),
        credentials: "include",
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Player Added Successfully",
          description: `${data.name} has been added to ${result.team}.`,
        });

        form.reset();
        onOpenChange(false);
        
        // Invalidate related queries to refresh cached data
        await queryClient.invalidateQueries({ queryKey: ['/api/players/parent'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/teams/club'] });
        // Force refetch by clearing all related cache
        await queryClient.refetchQueries({ queryKey: ['/api/teams/club'] });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Team Code",
          description: result.error || "Failed to add player",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add player. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-add-player">
        <DialogHeader>
          <DialogTitle>Add Player to Team</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-add-player">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter player's full name"
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
                      {...field}
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
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
                  <p className="text-xs text-muted-foreground">
                    Get the team code from your team manager. Demo codes start with "1".
                  </p>
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
                data-testid="button-add"
              >
                {isLoading ? "Adding..." : "Add Player"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
