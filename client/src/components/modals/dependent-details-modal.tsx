import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dependentDetailsSchema, type DependentDetails, updateDependentSchema, type UpdateDependent, type Player } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DependentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, the modal is in edit mode for this existing player */
  player?: Player;
  /** Called when the form submits successfully */
  onSuccess?: () => void;
}

const COUNTRIES = [
  "United Kingdom", "Ireland", "United States", "Canada", "Australia",
  "New Zealand", "France", "Germany", "Spain", "Italy", "Other",
];

const YES_NO_OPTIONS = ["Yes", "No"];

export default function DependentDetailsModal({ open, onOpenChange, player, onSuccess }: DependentDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = Boolean(player);

  const form = useForm<DependentDetails>({
    resolver: zodResolver(dependentDetailsSchema),
    defaultValues: isEditMode && player ? {
      teamCode: "--------", // dummy – not used in edit mode
      firstName: player.firstName ?? player.name.split(" ")[0] ?? "",
      lastName: player.lastName ?? player.name.split(" ").slice(1).join(" ") ?? "",
      dateOfBirth: player.dateOfBirth
        ? (typeof player.dateOfBirth === "string"
            ? player.dateOfBirth.split("T")[0]
            : new Date(player.dateOfBirth).toISOString().split("T")[0])
        : "",
      faNumber: player.faNumber ?? "",
      streetAddress1: player.streetAddress1 ?? "",
      streetAddress2: player.streetAddress2 ?? "",
      streetAddress3: player.streetAddress3 ?? "",
      streetAddress4: player.streetAddress4 ?? "",
      townCity: player.townCity ?? "",
      countyRegion: player.countyRegion ?? "",
      postCode: player.postCode ?? "",
      country: player.country ?? "United Kingdom",
      consentPhotograph: player.consentPhotograph ?? "",
      consentSocialMedia: player.consentSocialMedia ?? "",
      consentMedical: player.consentMedical ?? "",
      additionalRequirements: player.additionalRequirements ?? "",
      declaredLearningDisability: player.declaredLearningDisability ?? "",
      additionalInformation: player.additionalInformation ?? "",
      doctorName: player.doctorName ?? "",
      doctorPhone: player.doctorPhone ?? "",
      doctorAddress: player.doctorAddress ?? "",
      emergencyContacts: (player.emergencyContacts && player.emergencyContacts.length > 0)
        ? player.emergencyContacts
        : [{ firstName: "", lastName: "", mobilePhone: "", homePhone: "", email: "" }],
    } : {
      teamCode: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      faNumber: "",
      streetAddress1: "",
      streetAddress2: "",
      streetAddress3: "",
      streetAddress4: "",
      townCity: "",
      countyRegion: "",
      postCode: "",
      country: "United Kingdom",
      consentPhotograph: "",
      consentSocialMedia: "",
      consentMedical: "",
      additionalRequirements: "",
      declaredLearningDisability: "",
      additionalInformation: "",
      doctorName: "",
      doctorPhone: "",
      doctorAddress: "",
      emergencyContacts: [{ firstName: "", lastName: "", mobilePhone: "", homePhone: "", email: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "emergencyContacts",
  });

  const onSubmit = async (data: DependentDetails) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && player) {
        // Update existing player
        const response = await apiRequest("PUT", `/api/players/${player.id}`, {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth,
            faNumber: data.faNumber,
            streetAddress1: data.streetAddress1,
            streetAddress2: data.streetAddress2,
            streetAddress3: data.streetAddress3,
            streetAddress4: data.streetAddress4,
            townCity: data.townCity,
            countyRegion: data.countyRegion,
            postCode: data.postCode,
            country: data.country,
            consentPhotograph: data.consentPhotograph,
            consentSocialMedia: data.consentSocialMedia,
            consentMedical: data.consentMedical,
            additionalRequirements: data.additionalRequirements,
            declaredLearningDisability: data.declaredLearningDisability,
            additionalInformation: data.additionalInformation,
            doctorName: data.doctorName,
            doctorPhone: data.doctorPhone,
            doctorAddress: data.doctorAddress,
            emergencyContacts: data.emergencyContacts,
        });
        const result = await response.json();
        if (result.success) {
          toast({ title: "Details Updated", description: "Dependent details saved successfully." });
          await queryClient.invalidateQueries({ queryKey: ["/api/players/parent"] });
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update." });
        }
      } else {
        // Create new player via the existing /api/players route, then update with full details
        const createResponse = await apiRequest("POST", "/api/players", {
            name: `${data.firstName} ${data.lastName}`,
            dateOfBirth: data.dateOfBirth,
            teamCode: data.teamCode,
            parentId: user.id,
        });
        const createResult = await createResponse.json();
        if (!createResult.success) {
          toast({ variant: "destructive", title: "Invalid Team Code", description: createResult.error || "Failed to add player." });
          setIsLoading(false);
          return;
        }

        // Now update with full details
        const newPlayerId = createResult.player.id;
        await apiRequest("PUT", `/api/players/${newPlayerId}`, {
            firstName: data.firstName,
            lastName: data.lastName,
            faNumber: data.faNumber,
            streetAddress1: data.streetAddress1,
            streetAddress2: data.streetAddress2,
            streetAddress3: data.streetAddress3,
            streetAddress4: data.streetAddress4,
            townCity: data.townCity,
            countyRegion: data.countyRegion,
            postCode: data.postCode,
            country: data.country,
            consentPhotograph: data.consentPhotograph,
            consentSocialMedia: data.consentSocialMedia,
            consentMedical: data.consentMedical,
            additionalRequirements: data.additionalRequirements,
            declaredLearningDisability: data.declaredLearningDisability,
            additionalInformation: data.additionalInformation,
            doctorName: data.doctorName,
            doctorPhone: data.doctorPhone,
            doctorAddress: data.doctorAddress,
            emergencyContacts: data.emergencyContacts,
        });

        toast({ title: "Dependent Added", description: `${data.firstName} ${data.lastName} has been added to ${createResult.team}.` });
        form.reset();
        await queryClient.invalidateQueries({ queryKey: ["/api/players/parent"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/teams/club"] });
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{isEditMode ? "Edit Dependent Details" : "Add Dependent"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-5rem)] px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* Member Details */}
              <section>
                <h3 className="text-base font-semibold text-primary mb-4">Member Details</h3>
                <div className="space-y-4">
                  {!isEditMode && (
                    <FormField
                      control={form.control}
                      name="teamCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Code <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="8-character team code" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Get the team code from your team manager.</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="faNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FA Number</FormLabel>
                        <FormControl>
                          <Input placeholder="FA Number of the player" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">This is the FA Number of the player.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <Separator />

              {/* Address */}
              <section>
                <h3 className="text-base font-semibold text-primary mb-4">Address</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((n) => (
                    <FormField
                      key={n}
                      control={form.control}
                      name={`streetAddress${n}` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address {n}{n > 2 ? "" : ""}</FormLabel>
                          <FormControl>
                            <Input placeholder={`Street address line ${n}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="townCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Town / City <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Town or city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="countyRegion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>County / Region <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="County or region" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post Code <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Post code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* Requirements / Consents */}
              <section>
                <h3 className="text-base font-semibold text-primary mb-4">Requirements</h3>
                <div className="space-y-4">
                  {[
                    { name: "consentPhotograph", label: "Consent for us to photograph the member?" },
                    { name: "consentSocialMedia", label: "Consent for us to use those photographs on social media?" },
                    { name: "consentMedical", label: "Consent to receive medical treatment in an emergency?" },
                  ].map(({ name, label }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label} <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {YES_NO_OPTIONS.map((o) => (
                                <SelectItem key={o} value={o}>{o}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  <FormField
                    control={form.control}
                    name="additionalRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Any additional requirements or information</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Do not enter anything if there aren't any"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="declaredLearningDisability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Declared Learning Disability</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Do not enter anything if there isn't one"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalInformation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Information</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please tell us any additional information which may enable us to support the player in the best way possible. Do not enter anything if there isn't any."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <Separator />

              {/* Doctor's Details */}
              <section>
                <h3 className="text-base font-semibold text-primary mb-4">Doctor's Details</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="doctorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor's Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doctor's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="doctorPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor's Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Doctor's phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="doctorAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor's Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Doctor's surgery address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <Separator />

              {/* Emergency Contacts */}
              <section>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-semibold text-primary">Emergency Contacts</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This should be a contact, distinct from the parent or guardian registering the player.
                  At least one contact is required.
                </p>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Contact {index + 1}</span>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => remove(index)}
                            className="h-8"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`emergencyContacts.${index}.firstName`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input placeholder="First name" {...f} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`emergencyContacts.${index}.lastName`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input placeholder="Last name" {...f} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`emergencyContacts.${index}.mobilePhone`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Mobile Phone <span className="text-destructive">*</span></FormLabel>
                              <FormControl><Input placeholder="Mobile number" {...f} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`emergencyContacts.${index}.homePhone`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Home Phone</FormLabel>
                              <FormControl><Input placeholder="Home number (optional)" {...f} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`emergencyContacts.${index}.email`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl><Input placeholder="Email (optional)" type="email" {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => append({ firstName: "", lastName: "", mobilePhone: "", homePhone: "", email: "" })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add a Contact
                  </Button>
                </div>
              </section>

              {/* Footer buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Saving..." : isEditMode ? "Save Changes" : "Add Dependent"}
                </Button>
              </div>

            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
