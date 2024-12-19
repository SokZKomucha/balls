import { config } from "../config";
import { Color, colors } from "../types/Color";
import { Ball } from "./Ball";
import { EventEmitter } from "./EventEmitter";
import { Point } from "./Point";

interface EventMap {
  onGameOver: void
  onNewNextColors: Color[]
  onBallRemove: number
}

/** Represents and implements a Game class */
export class Game {

  /** Game's internal `<canvas>` HTML element. */
  public readonly canvas: HTMLCanvasElement;
  /** Game's canvas's 2D renderig context */
  private context: CanvasRenderingContext2D;
  /** An event emitter */
  private eventEmitter = new EventEmitter<EventMap>();
  /** Indicates whether game is running */
  private running = true;

  /** Game's ball list */
  private balls: Ball[] = [];
  /** Determines whether game can be interacted with, eg. can a ball be moved */
  private canBeInteractedWith = true;
  /** List of points corresponding to currently higlighted path. `null` if no path is highlighted */
  private highlightedPath: Point[] | null = null;
  /** Color of highlighted paths */
  private highlightedPathColor: string = "rgb(242, 175, 170)";
  /** List with colors of balls that will get added with next move */
  public readonly nextColors: Color[] = [];
  /** Index in ball list of currently selected ball. `null` if no ball is selected */
  private selectedBallIndex: number | null = null;

  /**
   * Creates new instance of Game class
   */
  public constructor() {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d")!;
    this.canvas.width = config.tileSize * config.gridWidth;
    this.canvas.height = config.tileSize * config.gridHeight;
    this.canvas.addEventListener("click", (e) => this.clickEvent(e));
    this.canvas.addEventListener("mousemove", (e) => this.hoverEvent(e));
  }

  /**
   * Method called with each mouse click event of the canvas
   * @param event MouseEvent
   * @returns 
   */
  private clickEvent(event: MouseEvent) {
    if (!this.canBeInteractedWith) return;
    if (!this.running) return;

    // Get click position & reset highlighted path (if any)
    const x = Math.floor(event.offsetX / config.tileSize);
    const y = Math.floor(event.offsetY / config.tileSize);
    const position = new Point(x, y);
    this.highlightedPath = null;

    // If no ball is selected
    if (this.selectedBallIndex === null) {
      const selectedBallIndex = this.balls.findIndex(e => e.position.compareTo(position));
      if (selectedBallIndex === -1) return;
      if (!this.canBeSelected(position)) return;
      this.selectedBallIndex = selectedBallIndex;
      this.render();
      return;
    }

    // If the same ball is selected
    if (this.balls[this.selectedBallIndex].position.compareTo(position)) {
      this.selectedBallIndex = null;
      this.render();
      return;
    }

    // If other ball is selected
    if (this.balls.find(e => e.position.compareTo(position)) && this.canBeSelected(position)) {
      this.selectedBallIndex = this.balls.findIndex(e => e.position.compareTo(position));
      this.render();
      return;
    }


    // Proceed to ball move
    // After move, disable interaction for 
    // interactionTimeout milliseconds, then render

    const from = this.balls[this.selectedBallIndex].position.clone();
    const path = this.pathfind(from, position);

    if (path.length === 0) return;

    this.balls[this.selectedBallIndex].moveTo(position);
    this.highlightedPathColor = "rgb(200, 200, 200)";
    this.highlightedPath = path;
    this.canBeInteractedWith = false;
    this.selectedBallIndex = null;
    this.render();

    const removedBallCount = this.checkBallCrossings();
    // Render only after the timeout
    
    setTimeout(() => {
      this.canBeInteractedWith = true;
      this.highlightedPath = null;
      removedBallCount === 0 && this.createNewBalls();
      removedBallCount !== 0 && this.emit("onBallRemove", removedBallCount);

      const secondRemove = this.checkBallCrossings();
      secondRemove !== 0 && this.emit("onBallRemove", secondRemove);

      this.render();
    }, config.interactionTimeout);

  }

  /**
   * Method called with each mousemove event over canvas 
   * @param event MouseEvent
   * @returns 
   */
  private hoverEvent(event: MouseEvent) {
    if (this.selectedBallIndex == null) return;
    if (!this.canBeInteractedWith) return;
    if (!this.running) return;

    const x = Math.floor(event.offsetX / config.tileSize);
    const y = Math.floor(event.offsetY / config.tileSize);
    const from = this.balls[this.selectedBallIndex].position.clone();
    const path = this.pathfind(from, new Point(x, y));

    this.highlightedPathColor = "rgb(242, 175, 170)";
    this.highlightedPath = new Point(x, y).compareTo(from) ? path.filter(e => !e.compareTo(from)) : path;
    this.render();
  }

  /**
   * Helper method to determine whether a ball at certain position may be selected
   * eg. is not surrounded by something on all 4 sides
   * @param position position of ball to check
   * @returns true or false
   */
  private canBeSelected(position: Point) {
    const neighbors = this.balls.filter(e => (
      e.position.compareTo(new Point(position.x - 1, position.y)) ||
      e.position.compareTo(new Point(position.x + 1, position.y)) ||
      e.position.compareTo(new Point(position.x, position.y - 1)) ||
      e.position.compareTo(new Point(position.x, position.y + 1))
    ));

    if (
      neighbors.length === 4 ||
      (neighbors.length === 3 && [0, config.gridWidth - 1].includes(position.x)) ||
      (neighbors.length === 3 && [0, config.gridHeight - 1].includes(position.y)) ||
      (neighbors.length === 2 && [0, config.gridWidth - 1].includes(position.x) && [0, config.gridHeight - 1].includes(position.y))
    ) return false;

    return true;
  }

  /**
   * Check whether 5 or more balls of the same color cross either horizontally, vertically, or diagonally.
   * If the removal is succesfull, return the total number of balls removed. Otherwise, return 0.
   * @returns total number of balls removed.
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

        while (nx >= 0 && nx < config.gridWidth && ny >= 0 && ny < config.gridHeight) {
          const nextBall = this.balls.find(b => b.position.x === nx && b.position.y === ny && b.color === ball.color);

          if (nextBall) sequence.push(nextBall);
          else break;

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
   * Populates the game grid with balls on game start
   */
  public createInitialBalls() {
    for (let i = 0; i < config.initialBallCount; i++) {
      const x = Math.floor(Math.random() * config.gridWidth);
      const y = Math.floor(Math.random() * config.gridHeight);
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
   * Populates the game grid with new balls after move
   * @returns 
  */
  private createNewBalls() {
    // Game over condition
    if (this.balls.length + 3 >= config.gridWidth * config.gridHeight) {
      this.running = false;
      this.emit("onGameOver", undefined);
      return;
    }

    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * config.gridWidth);
      const y = Math.floor(Math.random() * config.gridHeight);
      const position = new Point(x, y);

      if (this.balls.some(e => e.position.compareTo(position))) {
        i--;
        continue;
      }

      this.balls.push(new Ball(position, this.nextColors[i]));
      this.nextColors[i] = colors[Math.floor(Math.random() * colors.length)];
    }

    this.emit("onNewNextColors", this.nextColors);
  }

  /**
   * Finds a path from one point to another on game's grid.
   * @param from start point
   * @param to target point
   * @returns list of points representing found path, empty list if path is not found.
   */
  private pathfind(from: Point, to: Point) {
    const queue: Point[] = [];
    const visited = new Set<string>();
    const cameFrom: Map<string, Point | null> = new Map();

    queue.push(from);
    visited.add(from.toString());
    cameFrom.set(from.toString(), null);

    while (queue.length > 0) {
      const current = queue.shift()!;

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
          neighbor.x >= 0 && neighbor.x < config.gridWidth &&
          neighbor.y >= 0 && neighbor.y < config.gridHeight &&
          !this.balls.some(b => b.position.compareTo(neighbor))
        ) {
          queue.push(neighbor);
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

    if (this.highlightedPath) {
      this.highlightedPath.forEach(tile => {
        this.context.fillStyle = this.highlightedPathColor;
        this.context.fillRect(
          tile.x * config.tileSize,
          tile.y * config.tileSize,
          config.tileSize,
          config.tileSize
        );
      });
    }

    this.balls.forEach(ball => {
      this.context.fillStyle = ball.color;
      this.context.beginPath();

      this.context.arc(
        ball.position.x * config.tileSize + config.tileSize / 2,
        ball.position.y * config.tileSize + config.tileSize / 2,
        this.selectedBallIndex !== null && this.balls[this.selectedBallIndex].position.compareTo(ball.position) ? config.ballRadius + 2.5 : config.ballRadius,
        0,
        2 * Math.PI
      );

      this.context.fill();
      this.context.stroke();
      this.context.closePath();
    });
  }





  /**
   * Registers an event of name K. Multiple ev
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
