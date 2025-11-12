// Shared utility functions for dashboard widgets

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const getEventTypeBadgeColor = (type: string, friendly: boolean = false) => {
  if (type === "friendly" || (type === "match" && friendly)) {
    return "#3B82F6"; // Blue for friendly
  }
  if (type === "match") return "#DC2626"; // Red for match
  if (type === "tournament") return "#EAB308"; // Yellow
  if (type === "training") return "#10B981"; // Green
  if (type === "social") return "#6B7280"; // Gray
  return "#6B7280";
};

export const getEventDisplayType = (event: any) => {
  if (event.type === "friendly" || (event.type === "match" && event.friendly)) {
    return "Friendly";
  }
  if (event.type === "match") return "Match";
  if (event.type === "tournament") return "Tournament";
  if (event.type === "training") return "Training";
  if (event.type === "social") return "Social";
  return event.type.charAt(0).toUpperCase() + event.type.slice(1);
};

export const getAvailabilityCount = (fixture: any, teams: any[]) => {
  const team = teams.find((t: any) => t.id === fixture.teamId);
  const teamPlayerCount = team?.playerIds?.length || 0;

  const availabilityEntries = Object.values(fixture.availability || {});
  const confirmed = availabilityEntries.filter(
    (status) => status === "available",
  ).length;

  return { confirmed, total: teamPlayerCount };
};

export const getTeamName = (teamId: string, teams: any[]) => {
  const team = teams.find((t: any) => t.id === teamId);
  return team ? team.name : "Unknown Team";
};
