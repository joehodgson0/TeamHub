import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";
import { UpcomingEventsWidget } from "@/components/widgets/UpcomingEventsWidget";
import { UpcomingFixturesWidget } from "@/components/widgets/UpcomingFixturesWidget";
import { RecentResultsWidget } from "@/components/widgets/RecentResultsWidget";
import { TeamPostsWidget } from "@/components/widgets/TeamPostsWidget";

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
  const teams = teamsResponse?.teams || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome, {user?.firstName}!</Text>

        <UpcomingEventsWidget events={upcomingEvents} teams={teams} />
        <UpcomingFixturesWidget fixtures={upcomingFixtures} teams={teams} />
        <RecentResultsWidget results={recentResults} />
        <TeamPostsWidget posts={teamPosts} />
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
});
