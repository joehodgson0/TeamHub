import { useState, useEffect, useCallback } from "react";
import { storage } from "@/lib/storage";
import { User, Club, Team, Player, Fixture, Post, Award } from "@shared/schema";

export function useStorage() {
  const [data, setData] = useState({
    users: [] as User[],
    clubs: [] as Club[],
    teams: [] as Team[],
    players: [] as Player[],
    fixtures: [] as Fixture[],
    posts: [] as Post[],
    awards: [] as Award[],
  });

  const refreshData = useCallback(() => {
    setData({
      users: storage.getUsers(),
      clubs: storage.getClubs(),
      teams: storage.getTeams(),
      players: storage.getPlayers(),
      fixtures: storage.getFixtures(),
      posts: storage.getPosts(),
      awards: storage.getAwards(),
    });
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    ...data,
    refresh: refreshData,
    storage,
  };
}
