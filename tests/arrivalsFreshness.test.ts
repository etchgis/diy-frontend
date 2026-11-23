// Run with: node --experimental-strip-types --test tests/arrivalsFreshness.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ARRIVALS_STALE_AFTER_MS,
  ARRIVALS_UNAVAILABLE_TEXT,
  arrivalsAreStale,
  isArrivalsBody,
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
