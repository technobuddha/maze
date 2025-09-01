import { toError } from '@technobuddha/library';

/**
 * Executes a callback function on the next animation frame and returns its result as a Promise.
 *
 * This function is useful for synchronizing code execution with the browser's rendering cycle,
 * such as for smooth animations or UI updates.
 *
 * @typeParam T - The return type of the callback function.
 * @param callback - A function to be executed on the next animation frame.
 * @returns A Promise that resolves with the result of the callback, or rejects if the callback throws an error.
 */
export async function animate<T>(callback: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestAnimationFrame(() => {
      try {
        const result = callback();
        resolve(result);
      } catch (error) {
        reject(toError(error));
      }
    });
  });
}
