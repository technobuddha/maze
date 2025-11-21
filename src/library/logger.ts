/* eslint-disable no-console */

/**
 * Simple logging interface that wraps console methods.
 *
 * Provides a centralized logging interface that can be easily modified or replaced
 * without changing code throughout the application. Currently wraps standard
 * console methods with the ability to add debugging breakpoints or other
 * logging enhancements.
 *
 * @group Library
 * @category Logging
 */
export const logger = {
  /** Standard logging output */
  log: console.log,
  /** Warning message output */
  warn: console.warn,
  /** Error message output with optional debugging support */
  error: (...args: Parameters<typeof console.error>) => {
    console.error(...args);
    // debugger;
  },
  /** Clear the console output */
  clear: console.clear,
};
