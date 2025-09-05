// DEPRECATED: This hook has been replaced with React Query API calls
// All components should now use useQuery and useMutation from @tanstack/react-query

export function useStorage() {
  console.warn('useStorage hook is deprecated. Use React Query API calls instead.');
  
  // Return empty data structure for compatibility during migration
  return {
    users: [],
    clubs: [],
    teams: [],
    players: [],
    fixtures: [],
    posts: [],
    awards: [],
    refresh: () => console.warn('refresh() is deprecated. Use queryClient.invalidateQueries() instead.'),
    storage: null,
  };
}
