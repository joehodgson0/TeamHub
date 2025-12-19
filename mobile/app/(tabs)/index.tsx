import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { API_BASE_URL } from "@/lib/config";
import { UpcomingEventsWidget } from "@/components/widgets/UpcomingEventsWidget";
import { UpcomingFixturesWidget } from "@/components/widgets/UpcomingFixturesWidget";
import { RecentResultsWidget } from "@/components/widgets/RecentResultsWidget";
import { TeamPostsWidget } from "@/components/widgets/TeamPostsWidget";

export default function Dashboard() {
  const { user, refreshUser } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log(`[Dashboard] Tab mounted/focused - userId=${user?.id}`);
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming-session"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/players/parent", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["/api/match-results-session"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/teams/club", user?.clubId] });
    await queryClient.invalidateQueries({ queryKey: ["/api/posts-session"] });
    setRefreshing(false);
  };

  // Fetch upcoming events - load instantly from cache, fetch in background
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
    staleTime: 1000 * 60 * 5, // 5 minutes - prevents refetch on tab switch
    gcTime: 1000 * 60 * 10,
  });

  // Fetch user's players (for parent role) - load instantly from cache
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Fetch match results - load instantly from cache
  const { data: matchResultsResponse } = useQuery({
    queryKey: ["/api/match-results-session"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/match-results-session`,
        {
          credentials: "include",
        },
      );
      return response.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Fetch teams for team name resolution - load instantly from cache
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Fetch posts - load instantly from cache
  const { data: postsResponse } = useQuery({
    queryKey: ["/api/posts-session"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/posts-session`, {
        credentials: "include",
      });
      return response.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Filter events for user's teams
  const getUpcomingEvents = () => {
    if (!eventsResponse?.events) return [];

    let events = eventsResponse.events.filter(
      (event: any) => event.type !== "match" && event.type !== "friendly",
    );

    const relevantTeamIds = new Set<string>();

    // For coaches, include their managed teams
    if (user?.roles?.includes("coach") && user?.teamIds?.length) {
      user.teamIds.forEach((teamId: string) => relevantTeamIds.add(teamId));
    }

    // For parents, include teams their dependents play on
    if (user?.roles?.includes("parent") && playersResponse?.players) {
      playersResponse.players.forEach((player: any) => {
        if (player.teamId) relevantTeamIds.add(player.teamId);
      });
    }

    // Filter events to include any team the user is associated with
    if (relevantTeamIds.size > 0) {
      events = events.filter((event: any) => relevantTeamIds.has(event.teamId));
    }

    return events.slice(0, 3);
  };

  // Filter fixtures (matches) for user's teams
  const getUpcomingFixtures = () => {
    if (!eventsResponse?.events) return [];

    let fixtures = eventsResponse.events.filter(
      (event: any) => event.type === "match" || event.type === "friendly",
    );

    const relevantTeamIds = new Set<string>();

    // For coaches, include their managed teams
    if (user?.roles?.includes("coach") && user?.teamIds?.length) {
      user.teamIds.forEach((teamId: string) => relevantTeamIds.add(teamId));
    }

    // For parents, include teams their dependents play on
    if (user?.roles?.includes("parent") && playersResponse?.players) {
      playersResponse.players.forEach((player: any) => {
        if (player.teamId) relevantTeamIds.add(player.teamId);
      });
    }

    // Filter fixtures to include any team the user is associated with
    if (relevantTeamIds.size > 0) {
      fixtures = fixtures.filter((event: any) => relevantTeamIds.has(event.teamId));
    }

    return fixtures.slice(0, 3);
  };

  // Get recent match results - filter based on user's team associations
  const getRecentResults = () => {
    if (!matchResultsResponse?.matchResults) return [];

    const results = matchResultsResponse.matchResults;
    const relevantTeamIds = new Set<string>();

    // For coaches, include their managed teams
    if (user?.roles?.includes("coach") && user?.teamIds?.length) {
      user.teamIds.forEach((teamId: string) => relevantTeamIds.add(teamId));
    }

    // For parents, include teams their dependents play on
    if (user?.roles?.includes("parent") && playersResponse?.players) {
      playersResponse.players.forEach((player: any) => {
        if (player.teamId) relevantTeamIds.add(player.teamId);
      });
    }

    // If user has no team associations, return empty
    if (relevantTeamIds.size === 0) {
      return [];
    }

    // Filter results to include any team the user is associated with
    const filteredResults = results.filter((result: any) =>
      relevantTeamIds.has(result.teamId),
    );

    return filteredResults.slice(0, 3);
  };

  // Filter posts for user's teams
  const getTeamPosts = () => {
    if (!postsResponse?.posts) return [];

    let posts = postsResponse.posts;
    let filteredPosts: any[] = [];

    // For coaches, include posts from teams they manage
    if (user?.roles?.includes("coach")) {
      const coachPosts = posts.filter((post: any) => {
        // Show club-wide posts or posts for their specific teams
        return (
          (post.clubId === user?.clubId && !post.teamId) ||
          (user.teamIds && user.teamIds.includes(post.teamId))
        );
      });
      filteredPosts.push(...coachPosts);
    }
    // For parents (who are NOT coaches), filter by teams their players are on
    else if (user?.roles?.includes("parent") && playersResponse?.players) {
      const teamIds = playersResponse.players.map((p: any) => p.teamId);
      const parentPosts = posts.filter((post: any) => {
        // Show club-wide announcements or posts for their dependents' teams
        return (
          (!post.teamId && post.clubId === user?.clubId) ||
          teamIds.includes(post.teamId)
        );
      });
      // Parents only see announcements
      const announcementPosts = parentPosts.filter((post: any) => post.type === "announcement");
      filteredPosts.push(...announcementPosts);
    }
    // For other users (e.g., club admins), show club-wide posts
    else if (user?.clubId) {
      const clubPosts = posts.filter((post: any) => 
        post.clubId === user?.clubId && !post.teamId
      );
      filteredPosts.push(...clubPosts);
    }

    // Remove duplicates
    const uniquePosts = filteredPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    );

    return uniquePosts.slice(0, 3);
  };

  const upcomingEvents = getUpcomingEvents();
  const upcomingFixtures = getUpcomingFixtures();
  const recentResults = getRecentResults();
  const teamPosts = getTeamPosts();
  const teams = teamsResponse?.teams || [];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome, {user?.firstName}!</Text>

        <UpcomingEventsWidget events={upcomingEvents} teams={teams} />
        <UpcomingFixturesWidget fixtures={upcomingFixtures} teams={teams} />
        <RecentResultsWidget results={recentResults} teams={teams} />
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
