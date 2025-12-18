import { Tabs } from 'expo-router';
import { memo, useEffect } from 'react';
import { LayoutDashboard, Baby, Calendar, MessageSquare, Settings } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';

function TabsLayout() {
  // Use memoized context values - no network requests on tab switch
  const { isCoach, isParent, user } = useUser();

  useEffect(() => {
    console.log(`[TabsLayout] Rendered - isCoach=${isCoach}, isParent=${isParent}, userId=${user?.id}`);
  });

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: true,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Team',
          tabBarLabel: 'Team',
          href: isCoach ? '/teams' : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="sports-soccer" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dependents"
        options={{
          title: 'Dependents',
          tabBarLabel: 'Dependents',
          href: isParent ? '/dependents' : null,
          tabBarIcon: ({ color, size }) => (
            <Baby size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Posts',
          tabBarLabel: 'Posts',
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Memoize to prevent unnecessary re-renders on tab navigation
export default memo(TabsLayout);
