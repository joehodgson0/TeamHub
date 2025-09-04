import { User, Club, Team, Player, Fixture, Post, Award } from "@shared/schema";

export interface StorageData {
  users: User[];
  clubs: Club[];
  teams: Team[];
  players: Player[];
  fixtures: Fixture[];
  posts: Post[];
  awards: Award[];
  currentUserId: string | null;
}

const STORAGE_KEY = "teamhub_data";

const defaultData: StorageData = {
  users: [],
  clubs: [
    {
      id: "club1",
      name: "Hilly Fielders FC",
      code: "1ABC2345",
      established: "1987",
      totalTeams: 1,
      totalPlayers: 18,
      createdAt: new Date(),
    },
  ],
  teams: [
    {
      id: "team1",
      name: "U12 Eagles",
      ageGroup: "U12",
      code: "1DEF6789",
      clubId: "club1",
      managerId: "",
      playerIds: [],
      wins: 12,
      draws: 3,
      losses: 2,
      createdAt: new Date(),
    },
  ],
  players: [],
  fixtures: [],
  posts: [],
  awards: [],
  currentUserId: null,
};

class LocalStorage {
  private getData(): StorageData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.setData(defaultData);
        return defaultData;
      }
      
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      return {
        ...parsed,
        users: parsed.users.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt),
        })),
        clubs: parsed.clubs.map((club: any) => ({
          ...club,
          createdAt: new Date(club.createdAt),
        })),
        teams: parsed.teams.map((team: any) => ({
          ...team,
          createdAt: new Date(team.createdAt),
        })),
        players: parsed.players.map((player: any) => ({
          ...player,
          dateOfBirth: new Date(player.dateOfBirth),
          createdAt: new Date(player.createdAt),
        })),
        fixtures: parsed.fixtures.map((fixture: any) => ({
          ...fixture,
          startTime: new Date(fixture.startTime),
          endTime: new Date(fixture.endTime),
          createdAt: new Date(fixture.createdAt),
        })),
        posts: parsed.posts.map((post: any) => ({
          ...post,
          createdAt: new Date(post.createdAt),
        })),
        awards: parsed.awards.map((award: any) => ({
          ...award,
          createdAt: new Date(award.createdAt),
        })),
      };
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      this.setData(defaultData);
      return defaultData;
    }
  }

  private setData(data: StorageData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  // User methods
  getUsers(): User[] {
    return this.getData().users;
  }

  getUserById(id: string): User | undefined {
    return this.getUsers().find(user => user.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(user => user.email === email);
  }

  createUser(user: User): User {
    const data = this.getData();
    data.users.push(user);
    this.setData(data);
    return user;
  }

  updateUser(userId: string, updates: Partial<User>): User | undefined {
    const data = this.getData();
    const userIndex = data.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;
    
    data.users[userIndex] = { ...data.users[userIndex], ...updates };
    this.setData(data);
    return data.users[userIndex];
  }

  // Authentication
  getCurrentUserId(): string | null {
    return this.getData().currentUserId;
  }

  setCurrentUser(userId: string): void {
    const data = this.getData();
    data.currentUserId = userId;
    this.setData(data);
  }

  logout(): void {
    const data = this.getData();
    data.currentUserId = null;
    this.setData(data);
  }

  // Club methods
  getClubs(): Club[] {
    return this.getData().clubs;
  }

  getClubById(id: string): Club | undefined {
    return this.getClubs().find(club => club.id === id);
  }

  getClubByCode(code: string): Club | undefined {
    return this.getClubs().find(club => club.code === code);
  }

  createClub(club: Club): Club {
    const data = this.getData();
    data.clubs.push(club);
    this.setData(data);
    return club;
  }

  // Team methods
  getTeams(): Team[] {
    return this.getData().teams;
  }

  getTeamById(id: string): Team | undefined {
    return this.getTeams().find(team => team.id === id);
  }

  getTeamByCode(code: string): Team | undefined {
    return this.getTeams().find(team => team.code === code);
  }

  getTeamsByClubId(clubId: string): Team[] {
    return this.getTeams().filter(team => team.clubId === clubId);
  }

  getTeamsByManagerId(managerId: string): Team[] {
    return this.getTeams().filter(team => team.managerId === managerId);
  }

  createTeam(team: Team): Team {
    const data = this.getData();
    data.teams.push(team);
    this.setData(data);
    return team;
  }

  updateTeam(teamId: string, updates: Partial<Team>): Team | undefined {
    const data = this.getData();
    const teamIndex = data.teams.findIndex(team => team.id === teamId);
    if (teamIndex === -1) return undefined;
    
    data.teams[teamIndex] = { ...data.teams[teamIndex], ...updates };
    this.setData(data);
    return data.teams[teamIndex];
  }

  // Player methods
  getPlayers(): Player[] {
    return this.getData().players;
  }

  getPlayerById(id: string): Player | undefined {
    return this.getPlayers().find(player => player.id === id);
  }

  getPlayersByTeamId(teamId: string): Player[] {
    return this.getPlayers().filter(player => player.teamId === teamId);
  }

  getPlayersByParentId(parentId: string): Player[] {
    return this.getPlayers().filter(player => player.parentId === parentId);
  }

  createPlayer(player: Player): Player {
    const data = this.getData();
    data.players.push(player);
    this.setData(data);
    return player;
  }

  // Fixture methods
  getFixtures(): Fixture[] {
    return this.getData().fixtures;
  }

  getFixtureById(id: string): Fixture | undefined {
    return this.getFixtures().find(fixture => fixture.id === id);
  }

  getFixturesByTeamId(teamId: string): Fixture[] {
    return this.getFixtures().filter(fixture => fixture.teamId === teamId);
  }

  getUpcomingFixtures(teamId?: string): Fixture[] {
    const now = new Date();
    let fixtures = this.getFixtures().filter(fixture => fixture.startTime > now);
    
    if (teamId) {
      fixtures = fixtures.filter(fixture => fixture.teamId === teamId);
    }
    
    return fixtures.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  createFixture(fixture: Fixture): Fixture {
    const data = this.getData();
    data.fixtures.push(fixture);
    this.setData(data);
    return fixture;
  }

  updateFixture(fixtureId: string, updates: Partial<Fixture>): Fixture | undefined {
    const data = this.getData();
    const fixtureIndex = data.fixtures.findIndex(fixture => fixture.id === fixtureId);
    if (fixtureIndex === -1) return undefined;
    
    data.fixtures[fixtureIndex] = { ...data.fixtures[fixtureIndex], ...updates };
    this.setData(data);
    return data.fixtures[fixtureIndex];
  }

  // Post methods
  getPosts(): Post[] {
    return this.getData().posts;
  }

  getPostById(id: string): Post | undefined {
    return this.getPosts().find(post => post.id === id);
  }

  getPostsByTeamId(teamId: string): Post[] {
    return this.getPosts().filter(post => post.teamId === teamId);
  }

  getPostsByClubId(clubId: string): Post[] {
    return this.getPosts().filter(post => post.clubId === clubId);
  }

  createPost(post: Post): Post {
    const data = this.getData();
    data.posts.push(post);
    this.setData(data);
    return post;
  }

  // Award methods
  getAwards(): Award[] {
    return this.getData().awards;
  }

  getAwardsByTeamId(teamId: string): Award[] {
    return this.getAwards().filter(award => award.teamId === teamId);
  }

  createAward(award: Award): Award {
    const data = this.getData();
    data.awards.push(award);
    this.setData(data);
    return award;
  }
}

export const storage = new LocalStorage();
