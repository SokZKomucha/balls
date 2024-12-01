/** 
 * Represents a class implementing method `compareTo`, whose's objects may be compared to eachother
 */
export interface IComparable<T> {
  /**
   * Method used to compare different objects of identical types, by some condition predefined and implemented in class
   * @param comparator object to compare against
   * @returns `true` if the condition for equality is met, `false` otherwise 
   */
  compareTo: (comparator: T) => boolean
}