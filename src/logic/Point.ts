import { ICloneable } from "../types/ICloneable";
import { IComparable } from "../types/IComparable";
import { IPoint } from "../types/IPoint";

/** Represents and implements a point on rectangular grid */
export class Point implements IPoint, IComparable<Point>, ICloneable<Point> {
  public x: number
  public y: number

  /**
   * Creates new instance of Point class
   * @param x Point's x coordinate
   * @param y Point's y coordinate
   */
  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * @returns deep copy of original object
   */
  public clone() {
    return new Point(this.x, this.y);
  }

  public compareTo(comparator: Point) {
    return this.x === comparator.x && this.y === comparator.y;
  }

  public toString() {
    return `(${this.x}, ${this.y})`
  }
}