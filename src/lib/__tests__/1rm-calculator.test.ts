import { describe, it, expect } from 'vitest';
import {
  calculate1RM,
  calculateAverage1RM,
  calculatePercentage1RM,
  estimateRepsAt1RMPercentage,
  epleyFormula,
  brzyckiFormula,
  lombardiFormula,
  oconnerFormula,
  mayhewFormula,
} from '../utils/1rm-calculator';

describe('1RM calculator formulas', () => {
  it('computes 1RM using each formula', () => {
    const weight = 100;
    const reps = 5;
    expect(calculate1RM(weight, reps, epleyFormula)).toBe(117);
    expect(calculate1RM(weight, reps, brzyckiFormula)).toBe(113);
    expect(calculate1RM(weight, reps, lombardiFormula)).toBe(117);
    expect(calculate1RM(weight, reps, oconnerFormula)).toBe(113);
    expect(calculate1RM(weight, reps, mayhewFormula)).toBe(119);
  });

  it('returns 0 for non positive input', () => {
    expect(calculate1RM(0, 5)).toBe(0);
    expect(calculate1RM(100, 0)).toBe(0);
  });

  it('calculates average across formulas', () => {
    const avg = calculateAverage1RM(100, 5);
    expect(avg).toBe(116);
  });

  it('calculates percentage of 1RM', () => {
    expect(calculatePercentage1RM(200, 80)).toBe(160);
  });

  it('estimates reps at given percentage', () => {
    expect(estimateRepsAt1RMPercentage(80)).toBe(8);
    expect(estimateRepsAt1RMPercentage(100)).toBe(1);
    expect(estimateRepsAt1RMPercentage(0)).toBe(0);
  });
});
