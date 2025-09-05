import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function ClubCalendar() {
  return (
    <Card data-testid="card-club-calendar">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>Club Calendar</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6 text-muted-foreground">
          <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="font-medium mb-1">Coming Soon</p>
          <p className="text-xs">Club calendar integration will be available soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
