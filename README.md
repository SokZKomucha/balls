# Balls

Fun little browser game, written in vanilla Typescript. Given 9x9 grid, players must arrange at least 5 balls of the same color horizontally, vertically, or diagonally to gain points. But be careful, almost every move results in creation of 3 new, randomly colored balls - the grid fills up pretty quickly. How many points can you manage to get?

There's no set objective. Players may configure the game to their liking. Below is the list of all configurable options:

| Option                | Description                                                                   |
|-----------------------|-------------------------------------------------------------------------------|
| `tileSize`            | Side length of singular tile, in px                                           |
| `gridWidth`           | Width of game area                                                            |
| `gridHeight`          | Height of game area                                                           |
| `ballRadius`          | Radius of drawn balls, in px                                                  |
| `initialBallCount`    | Amount of balls spawned on game load                                          |
| `interactionTimeout`  | Timeout time (in milliseconds) after each move                                |
| `createBallsOnMove`   | Determines whether to create additional balls on move, may be useful to some  |

<br>

To build, use `npm run build` in root directory. Output files will be located in `/public`.

*English localization coming soon*
