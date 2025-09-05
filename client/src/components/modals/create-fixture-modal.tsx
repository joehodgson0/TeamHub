import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFixtureSchema, type CreateFixture, type Fixture } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useStorage } from "@/hooks/use-storage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X } from "lucide-react";

interface CreateFixtureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const eventTypes = [
  { value: "match", label: "Match" },
  { value: "tournament", label: "Tournament" },
  { value: "training", label: "Training" },
  { value: "social", label: "Social Event" },
];

export default function CreateFixtureModal({ open, onOpenChange }: CreateFixtureModalProps) {
  const { user } = useAuth();
  const { storage, refresh } = useStorage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const userTeams = user ? storage.getTeamsByManagerId(user.id) : [];
  
  const form = useForm<CreateFixture & { isFriendly: boolean }>({
    resolver: zodResolver(createFixtureSchema.extend({ isFriendly: createFixtureSchema.shape.type.optional() })),
    defaultValues: {
      type: "match",
      name: "",
      opponent: "",
      location: "",
      startTime: new Date(),
      endTime: new Date(),
      additionalInfo: "",
      isFriendly: false,
    },
  });

  const selectedType = form.watch("type");

  const onSubmit = async (data: CreateFixture & { isFriendly: boolean }) => {
    if (!user || userTeams.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must have at least one team to create events.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const fixtureId = `fixture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newFixture: Fixture = {
        id: fixtureId,
        type: data.isFriendly ? "friendly" : data.type,
        name: data.name,
        opponent: data.opponent || undefined,
        location: data.location,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        additionalInfo: data.additionalInfo || undefined,
        teamId: userTeams[0].id, // Use first team if user has teams
        availability: {},
        createdAt: new Date(),
      };

      storage.createFixture(newFixture);
      refresh();

      toast({
        title: "Event Created Successfully",
        description: `${data.name} has been scheduled.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create event. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-testid="modal-create-fixture">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add New Event</DialogTitle>
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-create-event">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-event-type">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes.map((type) => (
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

              {selectedType !== "tournament" && selectedType !== "training" && (
                <FormField
                  control={form.control}
                  name="isFriendly"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
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
            </div>

            {selectedType !== "match" && selectedType !== "training" && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedType === "tournament" ? "Tournament Name" : "Event Name"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={selectedType === "tournament" ? "e.g., Spring Cup 2025" : "e.g., vs. Riverside United"}
                        data-testid="input-event-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType !== "tournament" && selectedType !== "training" && (
              <FormField
                control={form.control}
                name="opponent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedType === "match" ? "Opponent" : "Opponent (if applicable)"}</FormLabel>
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
                disabled={isLoading}
                data-testid="button-create"
              >
                {isLoading ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
