import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/config';

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch upcoming events
  const { data: eventsResponse } = useQuery({
    queryKey: ['/api/events/upcoming-session'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/events/upcoming-session`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch user's players (for parent role)
  const { data: playersResponse } = useQuery({
    queryKey: ['/api/players/parent', user?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/players/parent/${user?.id}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user && user?.roles?.includes('parent'),
  });

  // Fetch match results
  const { data: matchResultsResponse } = useQuery({
    queryKey: ['/api/match-results-session'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/match-results-session`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch posts
  const { data: postsResponse } = useQuery({
    queryKey: ['/api/posts-session'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/posts-session`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user,
  });

  // Filter events for parent's teams
  const getUpcomingEvents = () => {
    if (!eventsResponse?.events) return [];
    
    let events = eventsResponse.events.filter(
      (event: any) => event.type !== "match" && event.type !== "friendly"
    );

    if (user?.roles?.includes('parent') && playersResponse?.players) {
      const teamIds = playersResponse.players.map((p: any) => p.teamId);
      events = events.filter((event: any) => teamIds.includes(event.teamId));
    }

    return events.slice(0, 3);
  };

  // Filter fixtures (matches) for parent's teams
  const getUpcomingFixtures = () => {
    if (!eventsResponse?.events) return [];
    
    let fixtures = eventsResponse.events.filter(
      (event: any) => event.type === "match" || event.type === "friendly"
    );

    if (user?.roles?.includes('parent') && playersResponse?.players) {
      const teamIds = playersResponse.players.map((p: any) => p.teamId);
      fixtures = fixtures.filter((event: any) => teamIds.includes(event.teamId));
    }

    return fixtures.slice(0, 3);
  };

  // Get recent match results
  const getRecentResults = () => {
    return matchResultsResponse?.matchResults?.slice(0, 3) || [];
  };

  // Filter posts for parent's teams
  const getTeamPosts = () => {
    if (!postsResponse?.posts) return [];
    
    let posts = postsResponse.posts;

    if (user?.roles?.includes('parent') && playersResponse?.players) {
      const teamIds = playersResponse.players.map((p: any) => p.teamId);
      posts = posts.filter((post: any) => 
        post.clubId === user?.clubId || teamIds.includes(post.teamId)
      );
      // Parents only see announcements
      posts = posts.filter((post: any) => post.type === "announcement");
    }

    return posts.slice(0, 3);
  };

  const upcomingEvents = getUpcomingEvents();
  const upcomingFixtures = getUpcomingFixtures();
  const recentResults = getRecentResults();
  const teamPosts = getTeamPosts();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>
                    {formatDate(event.startTime)} at {formatTime(event.startTime)}
                  </Text>
                </View>
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
            upcomingFixtures.map((fixture: any) => (
              <View key={fixture.id} style={styles.eventItem}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{fixture.title}</Text>
                  <Text style={styles.eventDate}>
                    {formatDate(fixture.startTime)} at {formatTime(fixture.startTime)}
                  </Text>
                  {fixture.location && (
                    <Text style={styles.eventLocation}>📍 {fixture.location}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Match Results Widget */}
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>🏆 Recent Results</Text>
          {recentResults.length === 0 ? (
            <Text style={styles.emptyText}>No recent results</Text>
          ) : (
            recentResults.map((result: any) => (
              <View key={result.id} style={styles.resultItem}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultOpponent}>vs. {result.opponent}</Text>
                  <Text style={styles.resultDate}>{formatDate(result.startTime)}</Text>
                </View>
                <View style={[
                  styles.resultBadge,
                  result.result === 'win' && styles.resultWin,
                  result.result === 'lose' && styles.resultLose,
                  result.result === 'draw' && styles.resultDraw,
                ]}>
                  <Text style={styles.resultScore}>{result.score || '-'}</Text>
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
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  widget: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 12,
  },
  eventItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  eventDate: {
    fontSize: 13,
    color: '#666',
  },
  eventLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultOpponent: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  resultDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  resultWin: {
    backgroundColor: '#4caf50',
  },
  resultLose: {
    backgroundColor: '#f44336',
  },
  resultDraw: {
    backgroundColor: '#ff9800',
  },
  resultScore: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  postItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9c27b0',
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#1a1a1a',
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  postAuthor: {
    fontSize: 11,
    color: '#999',
  },
});
