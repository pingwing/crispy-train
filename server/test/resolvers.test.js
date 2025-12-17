const test = require('node:test');
const assert = require('node:assert/strict');

// Tests run against compiled output to keep runtime simple (no TS test runner needed).
const { asMoneyString } = require('../dist/domain');

test('asMoneyString formats numbers and numeric strings', () => {
  assert.equal(asMoneyString(0), '0.00');
  assert.equal(asMoneyString(1), '1.00');
  assert.equal(asMoneyString(1.2), '1.20');
  assert.equal(asMoneyString('3.4'), '3.40');
  assert.equal(asMoneyString('12.34'), '12.34');
});

test('asMoneyString is resilient to bad inputs', () => {
  assert.equal(asMoneyString('not-a-number'), '0.00');
});


