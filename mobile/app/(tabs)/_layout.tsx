import { Tabs } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { LayoutDashboard, Baby, Calendar, MessageSquare, Settings } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';

// Pre-create stable icon components to prevent re-renders
const DashboardIcon = memo(({ color, size }: { color: string; size: number }) => (
  <LayoutDashboard size={size} color={color} />
));
const TeamsIcon = memo(({ color, size }: { color: string; size: number }) => (
  <MaterialIcons name="sports-soccer" size={size} color={color} />
));
const DependentsIcon = memo(({ color, size }: { color: string; size: number }) => (
  <Baby size={size} color={color} />
));
const EventsIcon = memo(({ color, size }: { color: string; size: number }) => (
  <Calendar size={size} color={color} />
));
const PostsIcon = memo(({ color, size }: { color: string; size: number }) => (
  <MessageSquare size={size} color={color} />
));
const SettingsIcon = memo(({ color, size }: { color: string; size: number }) => (
  <Settings size={size} color={color} />
));

function TabsLayout() {
  // Use memoized context values - no network requests on tab switch
  const { isCoach, isParent } = useUser();

  // Memoize screen options to prevent recalculation
  const screenOptions = useMemo(() => ({
    headerShown: true,
    tabBarActiveTintColor: '#2563EB',
    tabBarInactiveTintColor: '#6B7280',
  }), []);

  // Stable icon callbacks
  const renderDashboardIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <DashboardIcon color={color} size={size} />
  ), []);
  const renderTeamsIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <TeamsIcon color={color} size={size} />
  ), []);
  const renderDependentsIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <DependentsIcon color={color} size={size} />
  ), []);
  const renderEventsIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <EventsIcon color={color} size={size} />
  ), []);
  const renderPostsIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <PostsIcon color={color} size={size} />
  ), []);
  const renderSettingsIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <SettingsIcon color={color} size={size} />
  ), []);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: renderDashboardIcon,
          lazy: false,
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Team',
          tabBarLabel: 'Team',
          href: isCoach ? '/teams' : null,
          tabBarIcon: renderTeamsIcon,
          lazy: false,
        }}
      />
      <Tabs.Screen
        name="dependents"
        options={{
          title: 'Dependents',
          tabBarLabel: 'Dependents',
          href: isParent ? '/dependents' : null,
          tabBarIcon: renderDependentsIcon,
          lazy: false,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarLabel: 'Events',
          tabBarIcon: renderEventsIcon,
          lazy: false,
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Posts',
          tabBarLabel: 'Posts',
          tabBarIcon: renderPostsIcon,
          lazy: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: renderSettingsIcon,
          lazy: false,
        }}
      />
    </Tabs>
  );
}

// Memoize to prevent unnecessary re-renders on tab navigation
export default memo(TabsLayout);
