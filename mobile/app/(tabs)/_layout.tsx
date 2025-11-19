import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, Baby, Calendar, MessageSquare, Settings } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

export default function TabsLayout() {
  const { user } = useAuth();
  
  const isCoach = user?.roles?.includes('coach');
  const isParent = user?.roles?.includes('parent');
  const isBoth = isCoach && isParent;

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
            <Users size={size} color={color} />
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
