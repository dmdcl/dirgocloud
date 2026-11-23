// Unit tests for the budget app's pure logic (budget/js, no DOM, no Firebase).
// They don't need the emulator; npm test runs them with the rules tests.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { shiftMonth, todayMX } from '../../budget/js/dates.js';

describe('todayMX: the date in America/Mexico_City', () => {
  test('uses the Mexico City date, not the UTC date', () => {
    // 23:59:59 in Mexico City is already the next day in UTC.
    assert.equal(todayMX(new Date('2026-11-23T05:59:59Z')), '2026-11-22');
    assert.equal(todayMX(new Date('2026-11-23T06:00:00Z')), '2026-11-23');
  });

  test('changes year at Mexico City midnight', () => {
    assert.equal(todayMX(new Date('2027-01-01T05:59:59Z')), '2026-12-31');
    assert.equal(todayMX(new Date('2027-01-01T06:00:00Z')), '2027-01-01');
  });

  test('stays UTC-6 in summer (no daylight saving time since 2022)', () => {
    assert.equal(todayMX(new Date('2026-07-01T05:30:00Z')), '2026-06-30');
    assert.equal(todayMX(new Date('2026-07-01T06:00:00Z')), '2026-07-01');
  });

  test('defaults to the current instant', () => {
    assert.match(todayMX(), /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
  });
});

describe('shiftMonth', () => {
  test('moves forward and backward, across years', () => {
    assert.equal(shiftMonth('2026-11', 0), '2026-11');
    assert.equal(shiftMonth('2026-11', 1), '2026-12');
    assert.equal(shiftMonth('2026-12', 1), '2027-01');
    assert.equal(shiftMonth('2026-01', -1), '2025-12');
    assert.equal(shiftMonth('2026-11', 12), '2027-11');
    assert.equal(shiftMonth('2026-03', -14), '2025-01');
  });
});
