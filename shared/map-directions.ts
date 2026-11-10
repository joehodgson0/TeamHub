export function getAppleMapsDirectionsUrl(location: string): string | null {
  const destination = location.trim();
  if (!destination) return null;
  return `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}`;
}

export function getGoogleMapsDirectionsUrl(location: string): string | null {
  const destination = location.trim();
  if (!destination) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
