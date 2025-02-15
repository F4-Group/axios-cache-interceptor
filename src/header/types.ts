/**
 * Interpret the cache control header, if present.
 *
 * @param header The header object to interpret.
 * @returns `false` if cache should not be used. `undefined` when
 *   provided headers was not enough to determine a valid value. Or a
 *   `number` containing the number of **milliseconds** to cache the response.
 */
export type HeaderInterpreter = (
  headers?: Record<Lowercase<string>, string>
) => false | undefined | number;
