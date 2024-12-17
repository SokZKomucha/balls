export const tilesize = 40;
export const gridWidth = 9;
export const gridHeight = gridWidth;
export const ballRadius = 10;
export const ballCount = 8;

// I am unfortunately required to do this
interface IOptions {
  createBallsOnMove: boolean;
  consoleLog: boolean;
  disableMoveCollisions: boolean;
  highlightPath: boolean;
}

export const options = {
  createBallsOnMove: true,
  consoleLog: false,
  disableMoveCollisions: false,
  highlightPath: true
};