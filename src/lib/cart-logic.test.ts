/**
 * Unit Tests for Cart Logic
 * Run using: vitest or jest
 */

import { describe, test, expect } from 'vitest';
import { calculateCartTotal, validateQuantity } from './cart-logic';

describe('Cart Logic Tests', () => {
  test('calculates total for multiple items', () => {
    const items = [
      { id: '1', price: 1000, quantity: 2 },
      { id: '2', price: 500, quantity: 1 }
    ];
    expect(calculateCartTotal(items)).toBe(2500);
  });

  test('validates positive integer quantities', () => {
    expect(validateQuantity(5)).toBe(true);
    expect(validateQuantity(0)).toBe(false);
    expect(validateQuantity(-1)).toBe(false);
    expect(validateQuantity(1.5)).toBe(false);
  });

  test('validates extreme and invalid quantity values (edge cases)', () => {
    expect(validateQuantity(NaN)).toBe(false);
    expect(validateQuantity(Infinity)).toBe(false);
    expect(validateQuantity(-Infinity)).toBe(false);
    // Extreme large, but valid positive integer
    expect(validateQuantity(Number.MAX_SAFE_INTEGER)).toBe(true);
    // Over max safe integer might lose precision but technically JS might consider it an integer
    // However, usually we test boundary of safe integer
    expect(validateQuantity(Number.MAX_SAFE_INTEGER + 1)).toBe(true);
  });
});
