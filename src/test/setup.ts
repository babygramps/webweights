import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Polyfill ResizeObserver for chart components during tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// Provide a dummy DATABASE_URL for tests
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/test';
}

// Mock postgres package to avoid real DB connections during unit tests
vi.mock('postgres', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sqlMock: any = () => sqlMock;
  sqlMock.begin = () => sqlMock;
  sqlMock.end = () => Promise.resolve();
  return {
    __esModule: true,
    default: () => sqlMock,
    Sql: class {},
  };
});

// Mock drizzle-orm/postgres-js to return lightweight object
vi.mock('drizzle-orm/postgres-js', () => {
  return {
    __esModule: true,
    drizzle: () => ({}),
  };
});
