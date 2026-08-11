import { describe, expect, test } from 'bun:test';

import { CLOUD_MONTHLY_PLAN } from './pricing.js';

describe('CLOUD_MONTHLY_PLAN', () => {
  test('keeps public pricing copy consistent', () => {
    expect(CLOUD_MONTHLY_PLAN).toEqual({
      price: '$3.50',
      interval: 'month',
      checkoutLabel: 'Subscribe for $3.50/mo'
    });
  });
});
