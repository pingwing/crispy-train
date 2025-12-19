const test = require('node:test');
const assert = require('node:assert/strict');

// Tests run against compiled output to keep runtime simple (no TS test runner needed).
const { asMoneyString, NotANumberError } = require('../dist/domain');

test('asMoneyString formats numbers and numeric strings', () => {
  assert.equal(asMoneyString(0), '0.00');
  assert.equal(asMoneyString(1), '1.00');
  assert.equal(asMoneyString(1.2), '1.20');
  assert.equal(asMoneyString('3.4'), '3.40');
  assert.equal(asMoneyString('12.34'), '12.34');
});

test('asMoneyString throws a custom error for not-a-number inputs', () => {
  assert.throws(() => asMoneyString('not-a-number'), NotANumberError);
  assert.throws(() => asMoneyString(NaN), NotANumberError);
});

