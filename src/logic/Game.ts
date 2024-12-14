import { ballCount, ballRadius, options, gridHeight, gridWidth, tilesize } from "../config";
import { Color, colors } from "../types/Color";
import { Ball } from "./Ball";
import { EventEmitter } from "./EventEmitter";
import { Point } from "./Point";
import { Queue } from "./Queue";

type EventMap = {
  onGameOver: void,
  onNewNextColors: Color[],
  onBallRemove: number
}

/** Represents and implements a Game class */
export class Game {
  /** Game's ball list */
  public balls: Ball[] = [];
  /** Game's internal `<canvas>` HTML element. */
  public canvas: HTMLCanvasElement;
  /** Game's canvas's 2D renderig context */
  private context: CanvasRenderingContext2D;
  /** An event emitter */
  private eventEmitter = new EventEmitter<EventMap>();
  /** Determines whether to spawn balls after a move */
  private createBallsAfterMove = true;
  /** List of points corresponding to currently higlighted path. `null` if no path is highlighted */
  private highlightedPath: Point[] | null = null;
  /** Color of highlighted paths */
  private highlightedPathColor: string = "rgb(242, 175, 170)";
  /** List with colors of balls that will get added with next move */
  public readonly nextColors: Color[] = [];
  /** Indicates whether game is running */
  private running = true;
  /** Index in ball list of currently selected ball. `null` if no ball is selected */
  private selectedBallIndex: number | null = null;

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
    // this.nextColors = [0, 1, 2].map(_ => colors[Math.floor(Math.random() * colors.length)]); // moved to createInitialBalls

    options.consoleLog && console.log(this.nextColors);
  }

  /**
   * Method called with each mouse click event of the canvas
   * @param event MouseEvent
   * @returns 
   */
  private clickEvent(event: MouseEvent) {
    if (!this.running) return;

    // Get click position & reset highlighted path
    const x = Math.floor(event.offsetX / tilesize);
    const y = Math.floor(event.offsetY / tilesize);
    const position = new Point(x, y);

    if (this.highlightedPath && this.highlightedPathColor === "rgb(200, 200, 200)") {
      this.highlightedPath = null;
      this.createBallsAfterMove && this.createNewBalls();
      this.render();
      return;
    }

    this.highlightedPath = null;

    // If there's already a selected ball
    if (this.selectedBallIndex !== null) {
      
      // Remove selection
      if (this.balls[this.selectedBallIndex].position.compareTo(position)) {
        this.selectedBallIndex = null;
      } 
      
      // Change selection to a different ball
      else if (this.balls.find(e => e.position.compareTo(position)) && (options.disableMoveCollisions || this.canBeSelected(position))) {
        this.selectedBallIndex = this.balls.findIndex(e => e.position.compareTo(position));
      } 
     
      // Pathfind & move
      // Remove balls if conditions are met
      // Spawn if didn't remove any
      else {
        const from = this.balls[this.selectedBallIndex].position.clone();
        const to = position;
        const path = this.pathfind(from, to);

        if (path.length === 0 && !options.disableMoveCollisions) {
          return;
        }

        this.balls[this.selectedBallIndex].moveTo(position);
        this.highlightedPathColor = "rgb(200, 200, 200)";
        this.highlightedPath = path;
        this.selectedBallIndex = null;

        const removedBallCount = this.checkBallCrossings();

        if (removedBallCount !== 0) {
          this.createBallsAfterMove = false;
          this.emit("onBallRemove", removedBallCount);
        } else {
          this.createBallsAfterMove = true;
        }
      }
    } 
    
    // If there's no selected ball
    else {
      const selectedBallIndex = this.balls.findIndex(e => e.position.compareTo(position));
      if (selectedBallIndex === -1) return;
      if (!this.canBeSelected(position) && !options.disableMoveCollisions) return;
      this.selectedBallIndex = selectedBallIndex;
    }

    this.render();
  }

  /**
   * Method called with each mousemove event over canvas 
   * @param event MouseEvent
   * @returns 
   */
  private hoverEvent(event: MouseEvent) {
    if (!this.running) return;

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
   * Helper method determining whether a ball at certain position can be selected
   * (is not surrounded by something on all 4 sides)
   * @param position position of item to check
   * @returns true or false
   */
  private canBeSelected(position: Point) {
    const neighbours = this.balls.filter(e => (
      e.position.compareTo(new Point(position.x - 1, position.y)) ||
      e.position.compareTo(new Point(position.x + 1, position.y)) ||
      e.position.compareTo(new Point(position.x, position.y - 1)) ||
      e.position.compareTo(new Point(position.x, position.y + 1))
    ));

    if (
      neighbours.length === 4 ||
      (neighbours.length === 3 && [0, gridWidth - 1].includes(position.x)) ||
      (neighbours.length === 3 && [0, gridHeight - 1].includes(position.y)) ||
      (neighbours.length === 2 && [0, gridWidth - 1].includes(position.x) && [0, gridHeight - 1].includes(position.y))
    ) {
      return false;
    }

    return true;
  }

  /**
   * Check whether 5 or more balls of the same color cross either horizontally, vertically, or diagonally.
   * If the removal is succesfull, return total number of balls removed. Otherwise, return 0.
   * @returns total number of balls removed, or 0.
   */
  private checkBallCrossings() {
    const directions = [
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 }
    ];

    const toRemove = new Set<string>();

    for (const ball of this.balls) {
      for (const dir of directions) {
        const sequence: Ball[] = [ball];
        let nx = ball.position.x + dir.dx;
        let ny = ball.position.y + dir.dy;

        while (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          const nextBall = this.balls.find(b => b.position.x === nx && b.position.y === ny && b.color === ball.color);
          
          if (nextBall) {
            sequence.push(nextBall);
          } else {
            break;
          }

          nx += dir.dx;
          ny += dir.dy;
        }

        if (sequence.length >= 5) {
          sequence.forEach(b => toRemove.add(b.position.toString()));
        }
      }
    }

    this.balls = this.balls.filter(b => !toRemove.has(b.position.toString()));

    return toRemove.size;
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
      this.balls.push(new Ball(position, color));
    }

    for (let i = 0; i < 3; i++) {
      this.nextColors[i] = colors[Math.floor(Math.random() * colors.length)];
    }

    this.emit("onNewNextColors", this.nextColors);
  }

  /**
   * Populates game grid with three new balls on each moves
   * @returns 
  */
  private createNewBalls() {
    // Game over condition
    if (this.balls.length + 3 >= gridWidth * gridHeight) {
      this.running = false;
      this.emit("onGameOver", undefined);
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

    this.emit("onNewNextColors", this.nextColors);
    options.consoleLog && console.log(this.nextColors);
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
  public render() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (options.highlightPath && this.highlightedPath) {
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





  /**
   * Registers an event of name K
   * @param eventType event to register
   * @param eventCallback callback on emit
   */
  public on<K extends keyof EventMap>(eventType: K, eventCallback: (callback: EventMap[K]) => any) {
    this.eventEmitter.on(eventType, eventCallback);
  }

  /**
   * Executes all events with name K, emitting specified payload
   * @param eventType event to emit
   * @param payload payload to emit
   */
  private emit<K extends keyof EventMap>(eventType: K, payload: EventMap[K]) {
    this.eventEmitter.emit(eventType, payload);
  }
}
