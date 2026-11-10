import { ExternalLink } from "lucide-react";
import { getAppleMapsDirectionsUrl, getGoogleMapsDirectionsUrl } from "@shared/map-directions";

export function LocationMapLinks({ location }: { location: string }) {
  const appleMapsUrl = getAppleMapsDirectionsUrl(location);
  const googleMapsUrl = getGoogleMapsDirectionsUrl(location);
  if (!appleMapsUrl || !googleMapsUrl) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <a
        href={appleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Get directions to ${location} with Apple Maps`}
        data-testid="link-apple-maps"
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        <ExternalLink className="h-3 w-3" />
        Apple Maps
      </a>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Get directions to ${location} with Google Maps`}
        data-testid="link-google-maps"
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        <ExternalLink className="h-3 w-3" />
        Google Maps
      </a>
    </div>
  );
}
