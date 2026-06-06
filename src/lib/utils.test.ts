import { describe, test, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  test('combines basic classes', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  test('handles conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
    expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2');
  });

  test('resolves Tailwind CSS conflicts using tailwind-merge', () => {
    // text-red-500 should override text-blue-500
    expect(cn('text-blue-500', 'text-red-500')).toBe('text-red-500');
    // py-4 should override p-2 for the y-axis
    expect(cn('p-2', 'py-4')).toBe('p-2 py-4'); // tailwind-merge handles this as well, although py-4 does override y part of p-2
    // w-10 overrides w-5
    expect(cn('w-5', 'w-10')).toBe('w-10');
  });

  test('handles edge cases like undefined, null, and empty strings', () => {
    expect(cn('class1', undefined, null, '', 'class2')).toBe('class1 class2');
  });

  test('handles arrays of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    expect(cn(['class1', { class2: true }], 'class3')).toBe('class1 class2 class3');
  });
});
