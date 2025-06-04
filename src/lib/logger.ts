const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args: unknown[]): void => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (!isProduction) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (!isProduction) {
      console.info(...args);
    }
  },
};

export default logger;
