// Run with: node --experimental-strip-types --test tests/arrivalsFreshness.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ARRIVALS_STALE_AFTER_MS,
  ARRIVALS_UNAVAILABLE_TEXT,
  arrivalsAreStale,
  isArrivalsBody,
  isArrivalEntry,
  isDrawableArrivalsBody,
  isTimetableBody,
  isOtpPlanBody,
  matchResultsToDestinations,
} from '../lib/arrivalsFreshness.ts';

test('shows the plain unavailable line', () => {
  assert.equal(ARRIVALS_UNAVAILABLE_TEXT, 'Arrivals are not available right now');
});

test('fresh just under three minutes, stale at three minutes', () => {
  assert.equal(ARRIVALS_STALE_AFTER_MS, 180000);
  assert.equal(arrivalsAreStale(0, 179999), false);
  assert.equal(arrivalsAreStale(0, 180000), true);
  assert.equal(arrivalsAreStale(0, 600000), true);
});

test('a new good response makes the screen fresh again', () => {
  assert.equal(arrivalsAreStale(0, 200000), true);
  assert.equal(arrivalsAreStale(200000, 201000), false);
});

test('a last-fresh time in the future is not stale', () => {
  assert.equal(arrivalsAreStale(5000, 1000), false);
});

test('an empty arrivals list is a good body', () => {
  assert.equal(isArrivalsBody({ arrivals: [] }), true);
  assert.equal(isArrivalsBody({ arrivals: [{ id: 'a' }], name: 'Main St' }), true);
});

test('bodies without an arrivals list are bad', () => {
  assert.equal(isArrivalsBody(null), false);
  assert.equal(isArrivalsBody(undefined), false);
  assert.equal(isArrivalsBody('oops'), false);
  assert.equal(isArrivalsBody({}), false);
  assert.equal(isArrivalsBody({ arrivals: 'none' }), false);
  assert.equal(isArrivalsBody({ error: 'Not found' }), false);
});

test('an arrival needs numeric arrive and arriveScheduled', () => {
  assert.equal(isArrivalEntry({ arrive: 1000, arriveScheduled: 900 }), true);
  assert.equal(isArrivalEntry({}), false);
  assert.equal(isArrivalEntry({ arrive: '1000', arriveScheduled: 900 }), false);
  assert.equal(isArrivalEntry({ arrive: NaN, arriveScheduled: 900 }), false);
  assert.equal(isArrivalEntry(null), false);
});

test('the strict stop body check rejects entries that cannot be drawn', () => {
  assert.equal(isDrawableArrivalsBody({ arrivals: [] }), true);
  assert.equal(isDrawableArrivalsBody({ arrivals: [{ arrive: 1, arriveScheduled: 1 }] }), true);
  assert.equal(isDrawableArrivalsBody({ arrivals: [{}] }), false);
  assert.equal(isDrawableArrivalsBody({ arrivals: [{ arrive: 1, arriveScheduled: 1 }, {}] }), false);
  assert.equal(isDrawableArrivalsBody({}), false);
  assert.equal(isDrawableArrivalsBody({ arrivals: null }), false);
});

test('a timetable body needs a stops list; empty is good', () => {
  assert.equal(isTimetableBody({ stops: [] }), true);
  assert.equal(isTimetableBody({ stops: [{ stopId: 'a', departures: [] }] }), true);
  assert.equal(isTimetableBody({}), false);
  assert.equal(isTimetableBody(null), false);
  assert.equal(isTimetableBody({ stops: 'x' }), false);
});

test('a trip plan body needs an itineraries list or a plain no-trip error', () => {
  assert.equal(isOtpPlanBody({ plan: { itineraries: [] } }), true);
  assert.equal(isOtpPlanBody({ plan: { itineraries: [{ duration: 5 }] } }), true);
  assert.equal(isOtpPlanBody({ plan: {}, error: { id: 404, msg: 'No trip found', message: 'PATH_NOT_FOUND', noPath: true } }), true);
  assert.equal(isOtpPlanBody({ error: { id: 404, msg: 'Not found' } }), false);
  assert.equal(isOtpPlanBody({ error: { id: 404, msg: 'No trip found' } }), false);
  assert.equal(isOtpPlanBody({ error: { id: 404, message: 'PATH_NOT_FOUND' } }), false);
  assert.equal(isOtpPlanBody({ error: { id: 404, noPath: true } }), false);
  assert.equal(isOtpPlanBody({ error: { id: 500, msg: 'Server error' } }), false);
  assert.equal(isOtpPlanBody({ error: 'boom' }), false);
  assert.equal(isOtpPlanBody({}), false);
  assert.equal(isOtpPlanBody({ plan: {} }), false);
  assert.equal(isOtpPlanBody(null), false);
});

test('duplicate destination names match by coordinates; an omitted result stays unmatched', () => {
  const dests = [
    { name: 'Station', coordinates: { lat: 42.0, lng: -78.0 } },
    { name: 'Station', coordinates: { lat: 43.0, lng: -77.0 } },
  ];
  // Only the second destination has a result.
  const results = [{ destinationName: 'Station', destinationCoordinate: { lat: 43.00001, lon: -77.00001 } }];
  assert.deepEqual(matchResultsToDestinations(results, dests), [-1, 0]);
});

test('each result is used once and a far coordinate does not match', () => {
  const dests = [
    { name: 'A', coordinates: { lat: 1, lng: 1 } },
    { name: 'A', coordinates: { lat: 1, lng: 1 } },
  ];
  const results = [{ destinationName: 'A', destinationCoordinate: { lat: 1, lon: 1 } }];
  assert.deepEqual(matchResultsToDestinations(results, dests), [0, -1]);
  assert.deepEqual(
    matchResultsToDestinations([{ destinationName: 'A', destinationCoordinate: { lat: 2, lon: 1 } }], dests),
    [-1, -1]
  );
});
