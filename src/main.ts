import { Game } from "./logic/Game";
import { IPoint } from "./types/IPoint";

const app = document.getElementById("app")!;
const game = new Game();

app.appendChild(game.canvas);

game.createInitialBalls();
game.render();
game.canvas.style.outline = "1px solid black";
game.canvas.style.cursor = "pointer";