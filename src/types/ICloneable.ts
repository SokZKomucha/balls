/**
 * Represents a class implementing method `Clone`, whose's objects may be cloned
 */
export interface ICloneable<T> {
  /**
   * Method used to create, depending on it's implementation in class, either deep or shallow copy of an object of such class.
   * @returns returns a copy of original object
   */
  clone: () => T;
}