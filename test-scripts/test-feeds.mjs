#!/usr/bin/env node

/**
 * DIY Mobility Builder - Data Feed Endpoint Test Script
 *
 * Tests all external data feed endpoints used by the application.
 * Outputs logs to console and writes a CSV results file.
 *
 * Usage: node test-feeds.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Base URLs (from .env) ──────────────────────────────────────────────
const SKIDS_URL = "https://api.etch.app/skids";
const SKIDS_STAGE_URL = "https://api-stage.etch.app/skids";
const NYSDOT_STOPS_URL = "https://api.etch.app/nysdot-stops";
const OTP_URL =
  "https://511ny.etch.app/opentripplanner/otp/routers/default/plan";

// ── Mock data (NYC area) ───────────────────────────────────────────────
const ORIGIN = { lat: 40.7128, lng: -74.006 };
const TIMES_SQUARE = { lat: 40.758, lng: -73.9855 };
const ROUTE_SEARCH_TERM = "M1";
const NEARBY_RADIUS = 5000; // meters

// ── Helpers ────────────────────────────────────────────────────────────
const results = [];
let lastTestedUrl = ""; // Track the URL used in each test

function log(msg) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${msg}`);
}

function separator(label) {
  console.log("");
  console.log("=".repeat(70));
  console.log(`  ${label}`);
  console.log("=".repeat(70));
}

async function testEndpoint(name, fn) {
  const start = Date.now();
  lastTestedUrl = ""; // Reset before each test
  try {
    const detail = await fn();
    const elapsed = Date.now() - start;
    log(`PASS  ${name}  (${elapsed}ms)`);
    if (detail) log(`      ${detail}`);
    results.push({
      name,
      status: "PASS",
      elapsed: `${elapsed}ms`,
      detail: detail || "",
      error: "",
      url: lastTestedUrl,
    });
    return true;
  } catch (err) {
    const elapsed = Date.now() - start;
    const errMsg =
      err instanceof Error ? err.message : String(err);
    log(`FAIL  ${name}  (${elapsed}ms)`);
    log(`      Error: ${errMsg}`);
    results.push({
      name,
      status: "FAIL",
      elapsed: `${elapsed}ms`,
      detail: "",
      error: errMsg,
      url: lastTestedUrl,
    });
    return false;
  }
}

async function fetchJSON(url, options = {}) {
  lastTestedUrl = url; // Track the URL being tested
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

// ── 1. Open-Meteo Weather ──────────────────────────────────────────────
async function testOpenMeteo() {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${ORIGIN.lat}&longitude=${ORIGIN.lng}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

  const data = await fetchJSON(url);
  if (!data.current || data.current.temperature_2m === undefined) {
    throw new Error("Missing current temperature in response");
  }
  if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
    throw new Error("Missing daily forecast in response");
  }
  return `Temp: ${Math.round(data.current.temperature_2m)}°F, ${data.daily.time.length}-day forecast`;
}

// ── 2. SKIDS GBFS Nearby Stations (Citibike via backend) ───────────────
const CITIBIKE_SEARCH_RADIUS = 0.5; // miles
async function testSkidsGbfsNearby() {
  const url = `${SKIDS_STAGE_URL}/api/gbfs/stations/nearby?lat=${ORIGIN.lat}&lon=${ORIGIN.lng}&radius=${CITIBIKE_SEARCH_RADIUS}&system=citibike-nyc`;
  const data = await fetchJSON(url);
  if (!data.stations || data.stations.length === 0) {
    throw new Error("No nearby stations returned");
  }
  const withBikes = data.stations.filter((s) => s.bikesAvailable > 0).length;
  return `${data.stations.length} stations within ${CITIBIKE_SEARCH_RADIUS} mi, ${withBikes} with available bikes`;
}

// ── 4. NYSDOT Nearby Stops ─────────────────────────────────────────────
let discoveredStops = [];
async function testNearbyStops() {
  const url = `${NYSDOT_STOPS_URL}/nearby-stops?lat=${ORIGIN.lat}&lon=${ORIGIN.lng}&radius=${NEARBY_RADIUS}`;
  const data = await fetchJSON(url);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("No nearby stops returned");
  }
  discoveredStops = data;
  return `${data.length} stops within ${NEARBY_RADIUS}m of (${ORIGIN.lat}, ${ORIGIN.lng})`;
}

// ── 5. NYSDOT Routes Search ────────────────────────────────────────────
async function testRoutesSearch() {
  const url = `${NYSDOT_STOPS_URL}/routes?search=${encodeURIComponent(ROUTE_SEARCH_TERM)}`;
  const data = await fetchJSON(url);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No routes found for search "${ROUTE_SEARCH_TERM}"`);
  }
  const names = data
    .slice(0, 3)
    .map((r) => r.route_short_name || r.route_long_name)
    .join(", ");
  return `${data.length} routes found (e.g. ${names})`;
}

// ── 6. SKIDS Route Data ────────────────────────────────────────────────
let discoveredOrgId = null;
let discoveredServiceId = null;
let discoveredRouteId = null;
let discoveredPatternId = null;

async function testSkidsRouteData() {
  // Try to get orgId from discovered stops first
  if (discoveredStops.length > 0) {
    const stop = discoveredStops.find(
      (s) => s.services && s.services.length > 0
    );
    if (stop) {
      discoveredOrgId =
        stop.services[0].organization_guid ||
        stop.services[0].organization_id;
      discoveredServiceId =
        stop.services[0].service_guid || stop.services[0].service_id;
    }
  }

  if (!discoveredOrgId) {
    throw new Error(
      "No organizationId discovered from nearby stops — cannot test SKIDS"
    );
  }

  const url = `${SKIDS_URL}/feed/routes?geometry=false&stops=false&nysdot=true&serviceIds=${discoveredServiceId}`;
  const data = await fetchJSON(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Organization-Id": discoveredOrgId,
      "X-Skids-Route-Key": discoveredServiceId,
    },
  });

  // Response is { routes: [...] } not just an array
  const routes = data.routes || data;
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error("No routes returned from SKIDS");
  }

  // Store route ID and pattern ID for timetable test
  discoveredRouteId = routes[0].id || routes[0].route_id || routes[0].routeId;
  if (routes[0].patterns && routes[0].patterns.length > 0) {
    discoveredPatternId = routes[0].patterns[0].id;
  }

  const names = routes
    .slice(0, 3)
    .map((r) => r.shortName || r.route_short_name || r.id)
    .join(", ");
  return `${routes.length} routes (org: ${discoveredOrgId.slice(0, 8)}..., e.g. ${names})`;
}

// ── 7. SKIDS Stop Arrivals ─────────────────────────────────────────────
async function testSkidsStopArrivals() {
  if (!discoveredOrgId || !discoveredServiceId || discoveredStops.length === 0) {
    throw new Error("No discovered stop/service/org IDs — skipped");
  }

  const stop = discoveredStops.find(
    (s) => s.services && s.services.length > 0
  );
  const stopId = stop.stop_id;

  const url = `${SKIDS_URL}/feed/${discoveredServiceId}/stops/${stopId}?timestamp=${Date.now()}&n=7&nysdot=true`;
  const data = await fetchJSON(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Organization-Id": discoveredOrgId,
      "X-Skids-Route-Key": discoveredServiceId,
    },
  });

  // Response may be an object or array depending on API version
  const arrivals = Array.isArray(data) ? data : data.arrivals || data.stop_times || [];
  const arrivalCount = arrivals.length;
  return `Stop ${stopId}: ${arrivalCount} arrivals (keys: ${typeof data === "object" ? Object.keys(data).join(", ") : "ok"})`;
}

// ── 8. SKIDS Route Timetable ───────────────────────────────────────────
async function testSkidsRouteTimetable() {
  if (!discoveredOrgId || !discoveredServiceId || !discoveredRouteId) {
    throw new Error("No discovered route/service/org IDs — skipped");
  }

  const now = Date.now();
  const threeHoursLater = now + 3 * 60 * 60 * 1000;

  const url =
    `${SKIDS_URL}/feed/${discoveredServiceId}/routes/${discoveredRouteId}/timetable` +
    `?startTime=${now}&endTime=${threeHoursLater}&nysdot=true`;

  const data = await fetchJSON(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Organization-Id": discoveredOrgId,
      "X-Skids-Route-Key": discoveredServiceId,
    },
  });

  return `Route ${discoveredRouteId}: timetable received (${typeof data === "object" ? Object.keys(data).join(", ") : "ok"})`;
}

// ── 9. SKIDS Pattern Details ───────────────────────────────────────────
async function testSkidsPatternDetails() {
  if (!discoveredOrgId || !discoveredServiceId || !discoveredPatternId) {
    throw new Error("No discovered pattern/service/org IDs — skipped");
  }

  const url = `${SKIDS_URL}/feed/${discoveredServiceId}/patterns/${discoveredPatternId}?timestamp=${Date.now()}&nysdot=true`;
  const data = await fetchJSON(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Organization-Id": discoveredOrgId,
      "X-Skids-Route-Key": discoveredServiceId,
    },
  });

  const stopCount = data.stops?.length || 0;
  return `Pattern ${discoveredPatternId.slice(0, 8)}...: ${stopCount} stops, headsign: ${data.headsign || "n/a"}`;
}

// ── 10. SKIDS Transit Routing (POST) ───────────────────────────────────
async function testSkidsTransitRouting() {
  const body = {
    origin: { lat: ORIGIN.lat, lon: ORIGIN.lng },
    destinations: [
      {
        name: "Times Square",
        coordinate: { lat: TIMES_SQUARE.lat, lon: TIMES_SQUARE.lng },
      },
    ],
    options: { maxTransfers: 3 },
  };

  const url = `${SKIDS_URL}/api/transit/route/coordinates`;
  lastTestedUrl = `${url} [POST body: ${JSON.stringify(body)}]`; // Track URL with POST body
  // Use longer timeout for this endpoint (it can be slow)
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const data = await res.json();

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error("Empty transit routing response");
  }

  const routeCount = Array.isArray(data) ? data.length : 1;
  return `${routeCount} routing result(s) from (${ORIGIN.lat},${ORIGIN.lng}) to Times Square`;
}

// ── 10. OTP Transit Routing (Fallback) ─────────────────────────────────
async function testOTPTransitRouting() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  const h12 = hours % 12 || 12;
  const timeStr = `${h12}:${String(minutes).padStart(2, "0")}${ampm}`;
  const dateStr = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;

  const fromPlace = `${ORIGIN.lat},${ORIGIN.lng}`;
  const toPlace = `${TIMES_SQUARE.lat},${TIMES_SQUARE.lng}`;

  const url =
    `${OTP_URL}?fromPlace=${fromPlace}&toPlace=${toPlace}` +
    `&time=${timeStr}&date=${dateStr}` +
    `&arriveBy=false&showIntermediateStops=false` +
    `&wheelchair=false&locale=en&walkSpeed=1.25` +
    `&mode=TRANSIT,WALK,SUBWAY`;

  const data = await fetchJSON(url);
  if (!data.plan?.itineraries || data.plan.itineraries.length === 0) {
    throw new Error("No itineraries returned");
  }
  return `${data.plan.itineraries.length} itineraries found`;
}

// ── Run all tests ──────────────────────────────────────────────────────
async function main() {
  const startTime = new Date();
  console.log(`\nDIY Mobility Builder — Feed Endpoint Tests`);
  console.log(`Started: ${startTime.toISOString()}\n`);

  // Public / third-party feeds
  separator("PUBLIC FEEDS");
  await testEndpoint("Open-Meteo Weather Forecast", testOpenMeteo);
  await testEndpoint("SKIDS GBFS Nearby Stations (Citibike)", testSkidsGbfsNearby);

  // NYSDOT stops/routes (these also discover IDs for SKIDS tests)
  separator("NYSDOT ENDPOINTS");
  await testEndpoint("NYSDOT Nearby Stops", testNearbyStops);
  await testEndpoint("NYSDOT Routes Search", testRoutesSearch);

  // SKIDS endpoints (depend on discovered IDs from above)
  separator("SKIDS ENDPOINTS");
  await testEndpoint("SKIDS Route Data", testSkidsRouteData);
  await testEndpoint("SKIDS Stop Arrivals", testSkidsStopArrivals);
  await testEndpoint("SKIDS Pattern Details", testSkidsPatternDetails);
  await testEndpoint("SKIDS Route Timetable", testSkidsRouteTimetable);
  await testEndpoint("SKIDS Transit Routing (POST)", testSkidsTransitRouting);

  // OTP fallback
  separator("OTP (FALLBACK)");
  await testEndpoint("OTP Transit Routing", testOTPTransitRouting);

  // ── Summary ──────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  separator("SUMMARY");
  log(`Total: ${results.length}  |  Passed: ${passed}  |  Failed: ${failed}`);

  if (failed > 0) {
    console.log("\nFailed endpoints:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
  }

  // ── Write CSV ────────────────────────────────────────────────────────
  const csvHeader = "Endpoint,Status,Response Time,Detail,Error,URL";
  const csvRows = results.map((r) => {
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    return [esc(r.name), r.status, r.elapsed, esc(r.detail), esc(r.error), esc(r.url)].join(
      ","
    );
  });

  const csvContent = [csvHeader, ...csvRows].join("\n") + "\n";

  // Create timestamped filename (e.g., feed-test-results-2026-02-05T14-30-00.csv)
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const csvPath = path.join(__dirname, `feed-test-results-${timestamp}.csv`);
  fs.writeFileSync(csvPath, csvContent);
  log(`Results written to ${csvPath}`);
  console.log("");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
