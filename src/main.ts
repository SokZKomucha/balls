import { Game } from "./logic/Game";

const app = document.getElementById("grid")!;
const nextBallElements = document.querySelectorAll(".next-ball")!;
const highscoreElement = document.querySelector("#highscore")!;
const scoreElement = document.querySelector("#score")!;

const game = new Game();
let highscore = Number(localStorage.getItem("highscore") ?? "0") ?? 0;
let score = 0;

app.appendChild(game.canvas);
highscoreElement.textContent = highscore.toString();

game.on("onNewNextColors", (colors) => {
  colors.forEach((color, i) => {
    (nextBallElements[i] as HTMLElement).style.backgroundColor = color;
  });
});

game.on("onGameOver", () => {
  console.log("Game over!");
  (document.querySelector("#game-over") as HTMLElement).style.display = "flex";
});

game.on("onBallRemove", (count) => {
  score += count;
  scoreElement.textContent = score.toString();

  if (score >= highscore) {
    highscore = score;
    localStorage.setItem("highscore", highscore.toString());
    highscoreElement.textContent = highscore.toString();
  }
});

game.createInitialBalls();
game.render();
game.canvas.style.outline = "1px solid black";
game.canvas.style.cursor = "pointer";


