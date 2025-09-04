import { useAuth } from "@/hooks/use-auth";
import { useStorage } from "@/hooks/use-storage";

export default function Footer() {
  const { user } = useAuth();
  const { storage } = useStorage();

  const club = user?.clubId ? storage.getClubById(user.clubId) : null;
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  return (
    <footer className="bg-card border-t border-border py-4 px-6" data-testid="footer">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span data-testid="text-club-name">
          {club?.name || "TeamHub"}
        </span>
        <span data-testid="text-season">
          {currentYear}/{nextYear.toString().slice(-2)} Season
        </span>
      </div>
    </footer>
  );
}
