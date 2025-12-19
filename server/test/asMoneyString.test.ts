import test from 'node:test';
import assert from 'node:assert/strict';

import { asMoneyString, NotANumberError } from '../src/domain';

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


