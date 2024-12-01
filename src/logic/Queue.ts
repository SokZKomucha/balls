/**
 * Represents and implements generic queue, a popular FIFO data structure
 */
export class Queue<T> {
  private elements: T[] = [];

  /**
   * Adds an element to the end of the queue.
   * @param element element to be added
   */
  public enqueue(element: T) {
    this.elements.push(element);
  }

  /**
   * Removes an element from the beggining of the queue
   * @returns removed element, or `undefined` if there's nothing to remove
   */
  public dequeue() {
    return this.elements.shift();
  }

  /**
   * Returns size of the queue
   */
  public get Size(): number {
    return this.elements.length;
  }
}