import { queryClient } from './queryClient';

// Query key factories. Calling a factory without an id returns a "prefix" key
// that React Query treats as a wildcard, matching every cached query for that resource.
export const queryKeys = {
  playersByParent: (userId?: string) => (userId ? ['/api/players/parent', userId] : ['/api/players/parent']),
  playersByTeam: (teamId?: string) => (teamId ? ['/api/players/team', teamId] : ['/api/players/team']),
  teamsByClub: (clubId?: string) => (clubId ? ['/api/teams/club', clubId] : ['/api/teams/club']),
  club: (clubId?: string) => (clubId ? ['/api/clubs', clubId] : ['/api/clubs']),
  eventsAll: ['/api/events/all-session'],
  posts: ['/api/posts-session'],
  matchResults: ['/api/match-results-session'],
  matchResultByFixture: (fixtureId?: string) =>
    fixtureId ? ['/api/match-results/fixture', fixtureId] : ['/api/match-results/fixture'],
  feesMyStatus: ['/api/fees/my-status'],
  feesTeamStatus: (teamId?: string) => (teamId ? ['/api/fees/team-status', teamId] : ['/api/fees/team-status']),
};

// Grouped invalidation helpers so every mutation that touches an entity refreshes
// all the screens that read it, instead of each call site re-listing keys by hand.
export function invalidatePlayerData(opts: { userId?: string; clubId?: string; teamId?: string } = {}) {
  const { userId, clubId, teamId } = opts;
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.playersByParent(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.playersByTeam(teamId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.teamsByClub(clubId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.eventsAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.posts }),
    queryClient.invalidateQueries({ queryKey: queryKeys.matchResults }),
    queryClient.invalidateQueries({ queryKey: queryKeys.feesMyStatus }),
    queryClient.invalidateQueries({ queryKey: queryKeys.feesTeamStatus(teamId) }),
  ]);
}

export function invalidateTeamData(clubId?: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.teamsByClub(clubId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.playersByTeam() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.club(clubId) }),
  ]);
}

export function invalidateEventData() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.eventsAll });
}

export function invalidatePostData() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.posts });
}

export function invalidateMatchResultData(fixtureId?: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.matchResultByFixture(fixtureId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.eventsAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.matchResults }),
    queryClient.invalidateQueries({ queryKey: queryKeys.teamsByClub() }),
  ]);
}

export function invalidateFeeData(teamId?: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.feesMyStatus }),
    queryClient.invalidateQueries({ queryKey: queryKeys.feesTeamStatus(teamId) }),
  ]);
}

// Used by pull-to-refresh: force-refetches every cached query (mounted or not), so a manual
// refresh always brings all data up to date instead of silently skipping inactive screens.
export function refreshAllVisibleData() {
  return queryClient.invalidateQueries({ refetchType: 'all' });
}
