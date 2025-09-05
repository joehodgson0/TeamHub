import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Info } from "lucide-react";

export default function Club() {

  return (
    <div className="space-y-6" data-testid="club-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="heading-club">Club Management</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card data-testid="card-info">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-primary" />
              <span>Club Functionality Moved</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 space-y-4">
              <Building className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
              <div>
                <p className="text-lg font-medium mb-2">Club management has moved!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  You can now join clubs and manage your club information directly from the Team Management page.
                </p>
                <p className="text-xs text-muted-foreground">
                  This makes it easier to manage teams and clubs in one place since you need to be in a club before creating teams.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
