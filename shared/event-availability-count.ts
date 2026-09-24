export function getRosterAvailabilityCount(
  roster: { id: string }[],
  availability: Record<string, string> | null | undefined,
) {
  const playerIds = new Set(roster.map((player) => player.id));
  const confirmed = [...playerIds].filter((id) => availability?.[id] === "available").length;
  return { confirmed, total: playerIds.size };
}