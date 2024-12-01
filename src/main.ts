import { Game } from "./logic/Game";

const app = document.getElementById("grid")!;
const nextBallElements = document.querySelectorAll(".next-ball")!;
const game = new Game();

app.appendChild(game.canvas);


game.on("onNewNextColors", (colors) => {
  colors.forEach((color, i) => {
    (nextBallElements[i] as HTMLElement).style.backgroundColor = color;
  });
});

game.on("onGameOver", () => {
  console.log("Game over!");
})

game.createInitialBalls();
game.render();
game.canvas.style.outline = "1px solid black";
game.canvas.style.cursor = "pointer";


