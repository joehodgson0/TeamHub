import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shirt, UserPlus, Megaphone, Calendar } from "lucide-react";

const categories = [
  { key: "kit_request", label: "Kit Requests", icon: Shirt },
  { key: "player_request", label: "Player Requests", icon: UserPlus },
  { key: "announcement", label: "Announcements", icon: Megaphone },
  { key: "event", label: "Events", icon: Calendar },
];

export default function PostCategories() {
  return (
    <Card data-testid="card-post-categories">
      <CardHeader>
        <CardTitle>Post Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.key}
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2"
                data-testid={`category-${category.key}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
