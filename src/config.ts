export const tilesize = 40;
export const gridWidth = 9;
export const gridHeight = gridWidth;
export const ballRadius = 10;
export const ballCount = 8;

// Debug
export const debug = {
  createBallsOnMove: true,
  consoleLog: false,
  disableMoveCollisions: false,
  highlightPath: true
};

// Niezły wariant gry:
// - Ilość kulek 80
// - Wyłączone tworzenie nowych kulek
// - Wyłączona kolizja
// - Gracz musi jak najszybciej zbić wszystkie kulki

// UWAGA - do zbicia potrzeba 5ciu takich samych kulek,
// więc jak gracz przypadkowo nie zostawi sobie na później,
// to ma problem