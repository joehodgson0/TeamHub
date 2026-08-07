import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

/** Shown to non-admin users on fees/payments pages while the feature is being rolled out. */
export default function ComingSoon({
  title = "Coming soon!",
  description = "Fees and payments are being set up for your club. Check back soon.",
}: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]" data-testid="coming-soon">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Sparkles className="h-12 w-12 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
