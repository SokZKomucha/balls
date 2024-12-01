import { ballCount, ballRadius, debug, gridHeight, gridWidth, tilesize } from "../config";
import { Color, colors } from "../types/Color";
import { Ball } from "./Ball";
import { Point } from "./Point";
import { Queue } from "./Queue";

/** Represents and implements a Game class */
export class Game {
  /** Game's internal `<canvas>` HTML element. */
  public canvas: HTMLCanvasElement;
  /** Game's canvas's 2D renderig context */
  private context: CanvasRenderingContext2D;
  /** Game's ball list */
  public balls: Ball[] = [];
  /** Index in ball list of currently selected ball. `null` if no ball is selected */
  private selectedBallIndex: number | null = null;
  /** List of points corresponding to currently higlighted path. `null` if no path is highlighted */
  private highlightedPath: Point[] | null = null;
  /** Color of highlighted paths */
  private highlightedPathColor: string = "rgb(242, 175, 170)";
  /** List with colors of balls that will get added with next move */
  private nextColors: Color[] = [];

  /**
   * Creates new instance of a Game class
   */
  public constructor() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d")!;
    this.canvas.width = tilesize * gridWidth;
    this.canvas.height = tilesize * gridHeight;
    this.canvas.addEventListener("click", (e) => this.clickEvent(e));
    this.canvas.addEventListener("mousemove", (e) => this.hoverEvent(e));
    this.nextColors = [0, 1, 2].map(_ => colors[Math.floor(Math.random() * colors.length)]);

    debug.consoleLog && console.log(this.nextColors);
  }

  /**
   * Method called with each mouse click event of the canvas
   * @param event MouseEvent
   * @returns 
   */
  private clickEvent(event: MouseEvent) {
    const x = Math.floor(event.offsetX / tilesize);
    const y = Math.floor(event.offsetY / tilesize);
    const position = new Point(x, y);

    this.highlightedPath = null;

    if (this.selectedBallIndex !== null) {
      if (this.balls[this.selectedBallIndex].position.compareTo(position)) {
        this.selectedBallIndex = null;
      } else if (this.balls.find(e => e.position.compareTo(position))) {
        this.selectedBallIndex = this.balls.findIndex(e => e.position.compareTo(position));
      } else {
        const from = this.balls[this.selectedBallIndex].position.clone();
        const to = position;
        const path = this.pathfind(from, to);

        if (path.length === 0 && !debug.disableMoveCollisions) {
          return;
        }

        this.balls[this.selectedBallIndex].moveTo(position);
        this.highlightedPathColor = "rgb(200, 200, 200)";
        this.highlightedPath = path;
        this.selectedBallIndex = null;
        debug.createBallsOnMove && this.createNewBalls();
      }
    } else {
      const selectedBallIndex = this.balls.findIndex(e => e.position.compareTo(position));
      if (selectedBallIndex >= 0) this.selectedBallIndex = selectedBallIndex;
    }

    this.render();
  }

  /**
   * Method called with each mousemove event over canvas 
   * @param event MouseEvent
   * @returns 
   */
  private hoverEvent(event: MouseEvent) {
    const x = Math.floor(event.offsetX / tilesize);
    const y = Math.floor(event.offsetY / tilesize);
    const position = new Point(x, y);

    if (this.selectedBallIndex == null) {
      return;
    }

    const from = this.balls[this.selectedBallIndex].position.clone();
    const path = this.pathfind(from, position);

    this.highlightedPathColor = "rgb(242, 175, 170)";
    this.highlightedPath = path;
    this.render();
  }

  /**
   * Populates game grid with balls on game start
   */
  public createInitialBalls() {
    for (let i = 0; i < ballCount; i++) {
      const x = Math.floor(Math.random() * gridWidth);
      const y = Math.floor(Math.random() * gridHeight);
      const position = new Point(x, y);

      if (this.balls.some(e => e.position.compareTo(position))) {
        i--;
        continue;
      }

      const color = colors[Math.floor(Math.random() * colors.length)];
      this.balls.push(new Ball(position, color))
    }
  }

  /**
   * Populates game grid with three new balls on each moves
   * @returns 
   */
  private createNewBalls() {
    // Game over condition
    if (this.balls.length + 3 >= gridWidth * gridHeight) {
      return;
    }

    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * gridWidth);
      const y = Math.floor(Math.random() * gridHeight);
      const position = new Point(x, y);

      if (this.balls.some(e => e.position.compareTo(position))) {
        i--;
        continue;
      }

      this.balls.push(new Ball(position, this.nextColors[i]));
      this.nextColors[i] = colors[Math.floor(Math.random() * colors.length)];
    }

    debug.consoleLog && console.log(this.nextColors);
  }

  /**
   * Finds a path from one point to another on game's grid.
   * @param from point to start pathfinding from
   * @param to target point
   * @returns list of points representing found path, empty list if path is not found.
   */
  private pathfind(from: Point, to: Point) {
    const queue = new Queue<Point>();
    const visited = new Set<string>();
    const cameFrom: Map<string, Point | null> = new Map();

    queue.enqueue(from);
    visited.add(from.toString());
    cameFrom.set(from.toString(), null);

    while (queue.Size > 0) {
      const current = queue.dequeue()!;

      if (current.compareTo(to)) {
        const path = [];
        let step: Point | null = current;

        while (step) {
          path.unshift(step);
          step = cameFrom.get(step.toString()) || null;
        }

        return path;
      }

      for (const direction of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const neighbor = new Point(current.x + direction[0], current.y + direction[1]);
        const key = neighbor.toString();

        if (!visited.has(key) &&
          neighbor.x >= 0 && neighbor.x < gridWidth &&
          neighbor.y >= 0 && neighbor.y < gridHeight &&
          !this.balls.some(b => b.position.compareTo(neighbor))
        ) {
          queue.enqueue(neighbor);
          visited.add(key);
          cameFrom.set(key, current);
        }
      }
    }

    return [];
  }

  /**
   * Clears current canvas content and re-renders the game.
   */
  public async render() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (debug.highlightPath && this.highlightedPath) {
      this.highlightedPath.forEach(tile => {
        this.context.fillStyle = this.highlightedPathColor;
        this.context.fillRect(
          tile.x * tilesize,
          tile.y * tilesize,
          tilesize,
          tilesize
        );
      });
    }

    this.balls.forEach(ball => {
      this.context.fillStyle = ball.color;
      this.context.beginPath();

      this.context.arc(
        ball.position.x * tilesize + tilesize / 2,
        ball.position.y * tilesize + tilesize / 2,
        this.selectedBallIndex !== null && this.balls[this.selectedBallIndex].position.compareTo(ball.position) ? ballRadius + 2.5 : ballRadius,
        0,
        2 * Math.PI
      );

      this.context.fill();
      this.context.stroke();
      this.context.closePath();
    });
  }
}