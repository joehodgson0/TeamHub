import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, type CreateEvent, type Event } from "@shared/schema";
import { addEventDuration, EVENT_DURATION_OPTIONS, EVENT_MEET_BEFORE_OPTIONS, getEventDurationPreset } from "@shared/event-duration";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface EditFixtureModalProps {
  fixture: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const eventTypes = [
  { value: "match", label: "Match" },
  { value: "tournament", label: "Tournament" },
  { value: "training", label: "Training" },
  { value: "social", label: "Social Event" },
];

function toLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EditFixtureModal({ fixture, open, onOpenChange }: EditFixtureModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const initialDuration = getEventDurationPreset(fixture.startTime, fixture.endTime);
  const [duration, setDuration] = useState(initialDuration === null ? "custom" : String(initialDuration));
  const [meetBeforeMinutes, setMeetBeforeMinutes] = useState(String(fixture.meetBeforeMinutes || 0));
  
  // Fetch user's teams 
  const { data: teamsResponse } = useQuery<{ success: boolean; teams: any[] }>({
    queryKey: ['/api/teams/club', user?.clubId],
    enabled: !!user?.clubId,
  });
  
  const userTeams = teamsResponse?.teams || [];
  
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
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming-session'] });
    },
  });

  const form = useForm<CreateEvent & { homeAway: string }>({
    resolver: zodResolver(createEventSchema.extend({ 
      homeAway: z.string().optional()
    })),
    defaultValues: {
      type: fixture.type,
      friendly: fixture.friendly || false,
      name: fixture.name || "",
      opponent: fixture.opponent || "",
      location: fixture.location,
      startTime: fixture.startTime,
      endTime: fixture.endTime,
      additionalInfo: fixture.additionalInfo || "",
      homeAway: fixture.homeAway || "home",
    },
  });

  useEffect(() => {
    if (!open) return;

    const startTime = new Date(fixture.startTime instanceof Date ? fixture.startTime.getTime() : fixture.startTime);
    const endTime = new Date(fixture.endTime instanceof Date ? fixture.endTime.getTime() : fixture.endTime);
    const preset = getEventDurationPreset(startTime, endTime);
    setDuration(preset === null ? "custom" : String(preset));
    setMeetBeforeMinutes(String(fixture.meetBeforeMinutes || 0));
    form.reset({
      type: fixture.type,
      friendly: fixture.friendly || false,
      name: fixture.name || "",
      opponent: fixture.opponent || "",
      location: fixture.location,
      startTime,
      endTime,
      additionalInfo: fixture.additionalInfo || "",
      homeAway: fixture.homeAway || "home",
    });
  }, [fixture, form, open]);


  const onSubmit = async (data: CreateEvent & { homeAway: string }) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update events.",
      });
      return;
    }

    const endTime = duration === "custom"
      ? data.endTime
      : addEventDuration(data.startTime, Number(duration));

    if (!(endTime instanceof Date) || !Number.isFinite(endTime.getTime()) || endTime <= data.startTime) {
      form.setError("endTime", { message: "End time must be after start time." });
      return;
    }

    try {
      const eventData = {
        type: data.type,
        friendly: data.friendly || false,
        name: data.name,
        opponent: data.opponent || undefined,
        location: data.location,
        startTime: data.startTime,
        endTime,
        meetBeforeMinutes: Number(meetBeforeMinutes),
        additionalInfo: data.additionalInfo || undefined,
        homeAway: data.homeAway || undefined,
      };

      await updateEventMutation.mutateAsync(eventData);

      toast({
        title: "Event Updated Successfully",
        description: `${data.name || 'Event'} has been updated.`,
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
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-edit-event">
            {fixture.type === "match" && (
              <FormField
                control={form.control}
                name="friendly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-is-friendly"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Friendly</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(fixture.type === "tournament" || fixture.type === "social") && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fixture.type === "tournament" ? "Tournament Name" : "Name"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={fixture.type === "tournament" ? "e.g., Spring Cup 2025" : "e.g., Team BBQ"}
                        data-testid="input-event-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {fixture.type === "match" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="opponent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opponent</FormLabel>
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
                  name="homeAway"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home/Away</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-home-away">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="away">Away</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
                    <FormLabel>Start Date &amp; Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        data-testid="input-start-time"
                        {...field}
                        value={field.value instanceof Date ? toLocalDateTime(field.value) : field.value}
                        onChange={(e) => {
                          const startTime = new Date(e.target.value);
                          field.onChange(startTime);
                          if (duration !== "custom" && Number.isFinite(startTime.getTime())) {
                            form.setValue("endTime", addEventDuration(startTime, Number(duration)));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label htmlFor="edit-event-duration" className="text-sm font-medium leading-none">
                  Duration
                </label>
                <Select
                  value={duration}
                  onValueChange={(value) => {
                    setDuration(value);
                    if (value !== "custom") {
                      form.setValue("endTime", addEventDuration(form.getValues("startTime"), Number(value)));
                      form.clearErrors("endTime");
                    }
                  }}
                >
                  <SelectTrigger id="edit-event-duration" data-testid="select-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.minutes} value={String(option.minutes)}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom end time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {duration === "custom" && (
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        data-testid="input-end-time"
                        {...field}
                        value={field.value instanceof Date ? toLocalDateTime(field.value) : field.value}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-2">
              <label htmlFor="edit-event-meet-time" className="text-sm font-medium leading-none">
                Meet before start
              </label>
              <Select value={meetBeforeMinutes} onValueChange={setMeetBeforeMinutes}>
                <SelectTrigger id="edit-event-meet-time" data-testid="select-meet-before">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_MEET_BEFORE_OPTIONS.map((option) => (
                    <SelectItem key={option.minutes} value={String(option.minutes)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                The calculated meet time will appear on the dashboard.
              </p>
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
                {updateEventMutation.isPending ? "Updating..." : "Update Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
