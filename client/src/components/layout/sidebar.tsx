import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
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
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["coach", "parent"] },
  { path: "/club", label: "Club", icon: Building, roles: ["coach", "parent"] },
  { path: "/team", label: "Team", icon: Users, roles: ["coach", "parent"] },
  { path: "/events", label: "Events", icon: Calendar, roles: ["coach", "parent"] },
  { path: "/dependents", label: "Dependents", icon: Baby, roles: ["parent"] },
  { path: "/posts", label: "Posts", icon: Megaphone, roles: ["coach", "parent"] },
  { path: "/settings", label: "Settings", icon: Settings, roles: ["coach", "parent"] },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, hasRole } = useAuth();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === path;
  };

  return (
    <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)]" data-testid="sidebar">
      <nav className="p-4 space-y-2">
        {navigationItems
          .filter((item) => item.roles.some(role => hasRole(role as "coach" | "parent")))
          .map((item) => {
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
