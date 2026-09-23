export function normalizeDependentName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-GB");
}

export function dependentDateKey(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10);
}

export function isSameDependentIdentity(
  first: { name: string; dateOfBirth: Date | string; teamId: string },
  second: { name: string; dateOfBirth: Date | string; teamId: string },
): boolean {
  return first.teamId === second.teamId &&
    normalizeDependentName(first.name) === normalizeDependentName(second.name) &&
    dependentDateKey(first.dateOfBirth) === dependentDateKey(second.dateOfBirth);
}
