import assert from "node:assert/strict";
import test from "node:test";
import { getAppleMapsDirectionsUrl, getGoogleMapsDirectionsUrl } from "./map-directions";

test("map direction links encode the saved destination", () => {
  const destination = "Sports Ground, London SW1A 1AA";
  const encoded = encodeURIComponent(destination);

  assert.equal(getAppleMapsDirectionsUrl(` ${destination} `), `https://maps.apple.com/?daddr=${encoded}`);
  assert.equal(
    getGoogleMapsDirectionsUrl(destination),
    `https://www.google.com/maps/dir/?api=1&destination=${encoded}`,
  );
});

test("empty locations do not produce map links", () => {
  assert.equal(getAppleMapsDirectionsUrl("  "), null);
  assert.equal(getGoogleMapsDirectionsUrl(""), null);
});
