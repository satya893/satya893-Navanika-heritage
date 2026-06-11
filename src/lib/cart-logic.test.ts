/**
 * Unit Tests for Cart Logic
 * Run using: vitest or jest
 */

import { describe, test, expect } from 'vitest';
import { calculateCartTotal, validateQuantity, formatCurrency } from './cart-logic';

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

  test('formats currency correctly', () => {
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency(12345)).toBe('₹12,345');
    expect(formatCurrency(-50)).toBe('-₹50');
  });
});
