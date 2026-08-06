import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClubSchema, type CreateClub } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import type { Club } from "@shared/schema";

interface CreateClubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateClubModal({ open, onOpenChange }: CreateClubModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [createdClub, setCreatedClub] = useState<Club | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<CreateClub>({
    resolver: zodResolver(createClubSchema),
    defaultValues: { name: "", established: "" },
  });

  const onSubmit = async (data: CreateClub) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/clubs", data);
      const result = await res.json();
      setCreatedClub(result.club);
      await queryClient.refetchQueries({ queryKey: ["/api/clubs"] });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    if (createdClub) {
      navigator.clipboard.writeText(createdClub.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    form.reset();
    setCreatedClub(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Club</DialogTitle>
        </DialogHeader>

        {createdClub ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{createdClub.name}</span> has been created. Share the club code below with members so they can join.
            </p>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Badge variant="secondary" className="text-xl font-mono tracking-widest px-4 py-2">
                {createdClub.code}
              </Badge>
              <Button variant="outline" size="icon" onClick={copyCode} title="Copy code">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button className="w-full" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Hillyfielders FC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="established"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Established</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1998" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-xs text-muted-foreground">
                A unique 8-character club code will be generated automatically.
              </p>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Club"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
