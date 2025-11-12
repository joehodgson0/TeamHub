import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch upcoming events
  const { data: eventsResponse } = useQuery({
    queryKey: ["/api/events/upcoming-session"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/events/upcoming-session`,
        {
          credentials: "include",
        },
      );
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch user's players (for parent role)
  const { data: playersResponse } = useQuery({
    queryKey: ["/api/players/parent", user?.id],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/players/parent/${user?.id}`,
        {
          credentials: "include",
        },
      );
      return response.json();
    },
    enabled: !!user && user?.roles?.includes("parent"),
  });

  // Fetch match results
  const { data: matchResultsResponse } = useQuery({
    queryKey: ["/api/match-results-session"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/match-results-session`,
        {
          credentials: "include",
          cache: "no-store", // Disable fetch caching
        },
      );
      return response.json();
    },
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache in React Query
  });

  // Fetch teams for team name resolution
  const { data: teamsResponse } = useQuery({
    queryKey: ["/api/teams/club", user?.clubId],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/teams/club/${user?.clubId}`,
        {
          credentials: "include",
        },
      );
      return response.json();
    },
    enabled: !!user?.clubId,
  });

  // Fetch posts
  const { data: postsResponse } = useQuery({
    queryKey: ["/api/posts-session"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/posts-session`, {
        credentials: "include",
      });
      return response.json();
    },
    enabled: !!user,
  });

  // Filter events for parent's teams
  const getUpcomingEvents = () => {
    if (!eventsResponse?.events) return [];

    let events = eventsResponse.events.filter(
      (event: any) => event.type !== "match" && event.type !== "friendly",
    );

    if (user?.roles?.includes("parent") && playersResponse?.players) {
      const teamIds = playersResponse.players.map((p: any) => p.teamId);
      events = events.filter((event: any) => teamIds.includes(event.teamId));
    }

    return events.slice(0, 3);
  };

  // Filter fixtures (matches) for parent's teams
  const getUpcomingFixtures = () => {
    if (!eventsResponse?.events) return [];

    let fixtures = eventsResponse.events.filter(
      (event: any) => event.type === "match" || event.type === "friendly",
    );

    if (user?.roles?.includes("parent") && playersResponse?.players) {
      const teamIds = playersResponse.players.map((p: any) => p.teamId);
      fixtures = fixtures.filter((event: any) =>
        teamIds.includes(event.teamId),
      );
    }

    return fixtures.slice(0, 3);
  };

  // Get recent match results - filter based on user's team associations
  const getRecentResults = () => {
    if (!matchResultsResponse?.matchResults) return [];

    let results = matchResultsResponse.matchResults;

    // For coaches, filter by their managed teams
    if (user?.roles?.includes("coach") && user?.teamIds?.length) {
      results = results.filter((result: any) =>
        user.teamIds.includes(result.teamId),
      );
    }

    // For parents, filter by teams their players are on
    if (user?.roles?.includes("parent") && playersResponse?.players) {
      const teamIds = playersResponse.players.map((p: any) => p.teamId);
      results = results.filter((result: any) =>
        teamIds.includes(result.teamId),
      );
    }

    // If user has no team associations, return empty
    if (!user?.teamIds?.length && !playersResponse?.players?.length) {
      return [];
    }

    return results.slice(0, 3);
  };

  // Filter posts for user's teams
  const getTeamPosts = () => {
    if (!postsResponse?.posts) return [];

    let posts = postsResponse.posts;

    // For coaches, filter by their managed teams
    if (user?.roles?.includes("coach") && user?.teamIds?.length) {
      posts = posts.filter((post: any) => {
        // Show club-wide posts or posts for their specific teams
        return (
          (post.clubId === user?.clubId && !post.teamId) ||
          user.teamIds.includes(post.teamId)
        );
      });
    }

    // For parents, filter by teams their players are on
    // Note: For dual-role users, this further filters the coach results
    if (user?.roles?.includes("parent") && playersResponse?.players) {
      const teamIds = playersResponse.players.map((p: any) => p.teamId);
      posts = posts.filter((post: any) => {
        // Show club-wide announcements or posts for their dependents' teams
        return (
          (!post.teamId && post.clubId === user?.clubId) ||
          teamIds.includes(post.teamId)
        );
      });
      // Parents only see announcements
      posts = posts.filter((post: any) => post.type === "announcement");
    }

    // If user has no team associations, return empty
    if (!user?.teamIds?.length && !playersResponse?.players?.length) {
      return [];
    }

    return posts.slice(0, 3);
  };

  const upcomingEvents = getUpcomingEvents();
  const upcomingFixtures = getUpcomingFixtures();
  const recentResults = getRecentResults();
  const teamPosts = getTeamPosts();

  const getTeamName = (teamId: string) => {
    if (!teamsResponse?.teams) return "Unknown Team";
    const team = teamsResponse.teams.find((t: any) => t.id === teamId);
    return team ? team.name : "Unknown Team";
  };

  const getAvailabilityCount = (fixture: any) => {
    // Get the team to find total player count
    const teams = teamsResponse?.teams || [];
    const team = teams.find((t: any) => t.id === fixture.teamId);
    const teamPlayerCount = team?.playerIds?.length || 0;

    // Count confirmed availability
    const availabilityEntries = Object.values(fixture.availability || {});
    const confirmed = availabilityEntries.filter(
      (status) => status === "available",
    ).length;

    return { confirmed, total: teamPlayerCount };
  };

  const getEventTypeBadgeColor = (type: string, friendly: boolean = false) => {
    // Handle friendly type explicitly
    if (type === "friendly" || (type === "match" && friendly)) {
      return "#3B82F6"; // Blue for friendly
    }
    if (type === "match") return "#DC2626"; // Red for match
    if (type === "tournament") return "#EAB308"; // Yellow
    if (type === "training") return "#10B981"; // Green
    if (type === "social") return "#6B7280"; // Gray
    return "#6B7280";
  };

  const getEventDisplayType = (event: any) => {
    // Handle friendly type explicitly
    if (
      event.type === "friendly" ||
      (event.type === "match" && event.friendly)
    ) {
      return "Friendly";
    }
    if (event.type === "match") return "Match";
    if (event.type === "tournament") return "Tournament";
    if (event.type === "training") return "Training";
    if (event.type === "social") return "Social";
    return event.type.charAt(0).toUpperCase() + event.type.slice(1);
  };

  const formatDate = (dateString: string) => {
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome, {user?.firstName}!</Text>

        {/* Upcoming Events Widget */}
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>📅 Upcoming Events</Text>
          {upcomingEvents.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming events</Text>
          ) : (
            upcomingEvents.map((event: any) => (
              <View key={event.id} style={styles.eventCard}>
                {/* Type Badge and Name */}
                <View style={styles.eventCardHeader}>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: getEventTypeBadgeColor(
                          event.type,
                          event.friendly,
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.typeBadgeText}>
                      {getEventDisplayType(event)}
                    </Text>
                  </View>
                  <Text style={styles.eventCardTitle} numberOfLines={1}>
                    {event.name || "Event"}
                  </Text>
                </View>

                {/* Team */}
                {event.teamId && (
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Team: </Text>
                    <Text style={styles.detailValue}>
                      {getTeamName(event.teamId)}
                    </Text>
                  </Text>
                )}

                {/* Date & Time */}
                <Text style={styles.detailText}>
                  🕐 {formatDate(event.startTime)},{" "}
                  {formatTime(event.startTime)}
                </Text>

                {/* Location */}
                {event.location && (
                  <Text style={styles.detailText}>📍 {event.location}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Upcoming Fixtures Widget */}
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>⚽ Upcoming Fixtures</Text>
          {upcomingFixtures.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming fixtures</Text>
          ) : (
            upcomingFixtures.map((fixture: any) => {
              const availability = getAvailabilityCount(fixture);
              return (
                <View key={fixture.id} style={styles.fixtureCard}>
                  {/* Type Badge and Name */}
                  <View style={styles.eventCardHeader}>
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor: getEventTypeBadgeColor(
                            fixture.type,
                            fixture.friendly,
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {getEventDisplayType(fixture)}
                      </Text>
                    </View>
                    <Text style={styles.eventCardTitle} numberOfLines={1}>
                      {fixture.name || "Fixture"}
                    </Text>
                  </View>

                  {/* Team */}
                  {fixture.teamId && (
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Team: </Text>
                      <Text style={styles.detailValue}>
                        {getTeamName(fixture.teamId)}
                      </Text>
                    </Text>
                  )}

                  {/* Opponent */}
                  {fixture.opponent && (
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>vs </Text>
                      <Text style={styles.detailValue}>{fixture.opponent}</Text>
                    </Text>
                  )}

                  {/* Date & Time */}
                  <Text style={styles.detailText}>
                    🕐 {formatDate(fixture.startTime)},{" "}
                    {formatTime(fixture.startTime)}
                  </Text>

                  {/* Location */}
                  {fixture.location && (
                    <Text style={styles.detailText}>📍 {fixture.location}</Text>
                  )}

                  {/* Team-wide Availability Count */}
                  {availability.total > 0 && (
                    <View style={styles.availabilityRow}>
                      <Text style={styles.availabilityText}>
                        👥 {availability.confirmed}/{availability.total}{" "}
                        available
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Recent Match Results Widget */}
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>🏆 Recent Results 3</Text>
          {recentResults.length === 0 ? (
            <Text style={styles.emptyText}>No recent results</Text>
          ) : (
            recentResults.map((result: any) => (
              <View key={result.id} style={styles.resultItem}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultOpponent}>
                    vs. {result.opponent}
                  </Text>
                  <Text style={styles.resultDate}>
                    {formatDate(result.startTime)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.resultBadge,
                    result.result === "win" && styles.resultWin,
                    result.result === "lose" && styles.resultLose,
                    result.result === "draw" && styles.resultDraw,
                  ]}
                >
                  <Text style={styles.resultScore}>{result.score || "-"}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Team Posts Widget */}
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>📢 Team Posts</Text>
          {teamPosts.length === 0 ? (
            <Text style={styles.emptyText}>No recent posts</Text>
          ) : (
            teamPosts.map((post: any) => (
              <View key={post.id} style={styles.postItem}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postContent} numberOfLines={2}>
                  {post.content}
                </Text>
                <Text style={styles.postAuthor}>
                  By {post.authorName} • {formatDate(post.createdAt)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  widget: {
    marginBottom: 24,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 12,
  },
  eventCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  fixtureCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  eventCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailLabel: {
    color: "#9CA3AF",
  },
  detailValue: {
    fontWeight: "500",
    color: "#111827",
  },
  availabilityRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  availabilityText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  eventItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
    color: "#1a1a1a",
  },
  eventDate: {
    fontSize: 13,
    color: "#666",
  },
  eventLocation: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultOpponent: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  resultDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  resultWin: {
    backgroundColor: "#4caf50",
  },
  resultLose: {
    backgroundColor: "#f44336",
  },
  resultDraw: {
    backgroundColor: "#ff9800",
  },
  resultScore: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  postItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#9c27b0",
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#1a1a1a",
  },
  postContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 6,
  },
  postAuthor: {
    fontSize: 11,
    color: "#999",
  },
});
