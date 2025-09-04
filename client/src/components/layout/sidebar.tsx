import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building,
  Users,
  Calendar,
  Baby,
  Megaphone,
  Settings,
} from "lucide-react";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/club", label: "Club", icon: Building },
  { path: "/team", label: "Team", icon: Users },
  { path: "/events", label: "Events", icon: Calendar },
  { path: "/dependents", label: "Dependents", icon: Baby },
  { path: "/posts", label: "Posts", icon: Megaphone },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === path;
  };

  return (
    <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)]" data-testid="sidebar">
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left px-3 py-2 h-auto",
                isActive(item.path) && "bg-primary/10 text-primary"
              )}
              onClick={() => setLocation(item.path)}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
