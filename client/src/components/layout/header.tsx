import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();

  // Fetch club data
  const { data: clubResponse } = useQuery<{ success: boolean; club: any }>({
    queryKey: ['/api/clubs', user?.clubId],
    enabled: !!user?.clubId,
  });

  const club = clubResponse?.club;
  
  const getRoleLabel = () => {
    if (!user?.roles) return "User";
    if (user.roles.includes("coach") && user.roles.includes("parent")) {
      return "Manager & Parent";
    }
    if (user.roles.includes("coach")) return "Manager";
    if (user.roles.includes("parent")) return "Parent";
    return "User";
  };

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6" data-testid="header">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold">T</span>
          </div>
          <span className="font-bold text-lg" data-testid="text-app-name">TeamHub</span>
        </div>
        {club && (
          <div className="text-sm text-muted-foreground" data-testid="text-club-name">
            {club.name}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm">
          <Badge variant="secondary" className="bg-primary/10 text-primary" data-testid="badge-user-role">
            {getRoleLabel()}
          </Badge>
          <span data-testid="text-user-name">{user?.name || "User"}</span>
          <span className="text-muted-foreground" data-testid="text-user-email">{user?.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-muted-foreground hover:text-foreground"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
