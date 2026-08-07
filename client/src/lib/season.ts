/** Utilities for working with football "season" strings, e.g. "2026/27". */

/** Returns the current season string based on today's date (season starts in August). */
export function getCurrentSeason(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed; August = 7
  const year = date.getFullYear();
  const startYear = month >= 7 ? year : year - 1;
  const endYearShort = (startYear + 1) % 100;
  return `${startYear}/${endYearShort.toString().padStart(2, "0")}`;
}

/** Returns a handful of season strings around the current one, for pickers. */
export function getSeasonOptions(count: number = 4, date: Date = new Date()): string[] {
  const current = getCurrentSeason(date);
  const [startYearStr] = current.split("/");
  const startYear = parseInt(startYearStr, 10);
  return Array.from({ length: count }, (_, i) => {
    const year = startYear + i;
    return `${year}/${((year + 1) % 100).toString().padStart(2, "0")}`;
  });
}
