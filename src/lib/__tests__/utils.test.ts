import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
  it('merges and deduplicates classes', () => {
    expect(cn('px-2', 'py-2', 'px-2')).toBe('px-2 py-2');
  });

  it('handles conditional values', () => {
    const hidden = false;
    expect(cn('p-2', hidden && 'hidden', ['text-sm'])).toBe('p-2 text-sm');
  });
});
