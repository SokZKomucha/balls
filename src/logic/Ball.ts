import { Color } from "../types/Color";
import { ICloneable } from "../types/ICloneable";
import { Point } from "./Point";

/**
 * Represents and implements a Ball class
 */
export class Ball implements ICloneable<Ball> {
  /** Ball's position on game grid */
  public position: Point
  /** Ball's color */
  public readonly color: Color

  /**
   * Creates new instance of a Ball class
   * @param position Ball's position on game grid
   * @param color Ball's color
   */
  public constructor(position: Point, color: Color) {
    this.position = position;
    this.color = color;
  }

  /**
   * @returns deep copy of original object
   */
  public clone() {
    return new Ball(this.position.clone(), this.color);
  }

  /**
   * Moves the ball the specified position on game grid.
   * @param position position to move to 
   */
  public moveTo(position: Point) {
    this.position.x = position.x;
    this.position.y = position.y;
  }
}