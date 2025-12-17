import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { UserProvider, useUser } from '@/context/UserContext';
import { useEffect } from 'react';

function RootLayoutNav() {
  const { isAuthenticated, user, isLoading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/landing');
    } else if (isAuthenticated && !user?.roles?.length) {
      router.replace('/(auth)/role-selection');
    } else if (isAuthenticated && user?.roles?.length && !inTabsGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, user, segments, isLoading]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <RootLayoutNav />
      </UserProvider>
    </QueryClientProvider>
  );
}
