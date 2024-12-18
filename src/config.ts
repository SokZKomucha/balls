interface IConfig {
  tilesize: number;
  gridWidth: number;
  gridHeight: number;
  ballRadius: number;
  initialBallCount: number;
  interactionTimeout: number;
  createBallsOnMove: boolean;
}

export const config = {
  tilesize: 40,
  gridWidth: 9,
  gridHeight: 9,
  ballRadius: 10,
  initialBallCount: 8,
  interactionTimeout: 350,
  createBallsOnMove: true,
};