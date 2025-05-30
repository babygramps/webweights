import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
  it('merges and deduplicates classes', () => {
    const classes = cn('px-2', 'py-2', 'px-2');
    const tokens = classes.split(/\s+/);
    expect(new Set(tokens)).toEqual(new Set(['px-2', 'py-2']));
  });

  it('handles conditional values', () => {
    const hidden = false;
    expect(cn('p-2', hidden && 'hidden', ['text-sm'])).toBe('p-2 text-sm');
  });
});
