import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, type CreateEvent, type Event } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X } from "lucide-react";

interface EditFixtureModalProps {
  fixture: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fixtureTypes = [
  { value: "match", label: "Match" },
  { value: "friendly", label: "Friendly" },
  { value: "tournament", label: "Tournament" },
  { value: "training", label: "Training" },
  { value: "social", label: "Social Event" },
];

export default function EditFixtureModal({ fixture, open, onOpenChange }: EditFixtureModalProps) {
  const { toast } = useToast();
  
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch(`/api/events/${fixture.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming'] });
    },
  });

  const form = useForm<CreateEvent>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      type: fixture.type,
      name: fixture.name,
      opponent: fixture.opponent || "",
      location: fixture.location,
      startTime: fixture.startTime,
      endTime: fixture.endTime,
      additionalInfo: fixture.additionalInfo || "",
    },
  });

  const onSubmit = async (data: CreateEvent) => {
    try {
      const eventData = {
        type: data.type,
        name: data.name,
        opponent: data.opponent || undefined,
        location: data.location,
        startTime: data.startTime,
        endTime: data.endTime,
        additionalInfo: data.additionalInfo || undefined,
      };

      await updateEventMutation.mutateAsync(eventData);

      toast({
        title: "Event Updated Successfully",
        description: `${data.name} has been updated.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update event. Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-testid="modal-edit-fixture">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Fixture</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-edit-fixture">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixture Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-fixture-type">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fixtureTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixture Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., vs. Riverside United"
                        data-testid="input-fixture-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="opponent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opponent (if applicable)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter opponent name"
                      data-testid="input-opponent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter location"
                      data-testid="input-location"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        data-testid="input-start-time"
                        {...field}
                        value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        data-testid="input-end-time"
                        {...field}
                        value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional details..."
                      rows={3}
                      data-testid="textarea-additional-info"
                      {...field}
                    />
                  </FormControl>
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
                disabled={updateEventMutation.isPending}
                data-testid="button-update"
              >
                {updateEventMutation.isPending ? "Updating..." : "Update Fixture"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
