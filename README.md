# Balls

Fun little browser game, written in vanilla Typescript. Given 9x9 grid, players must arrange at least 5 balls of the same color horizontally, vertically, or diagonally to gain points. But be careful, almost every move results in creation of 3 new, randomly colored balls - the grid fills up pretty quickly. How many points can you manage to get?

There's no set objective, players can configure their gameplay to their liking, even creating some new game modes. As an example, I've created a cool gamemode, where all tiles but one are filled with balls and players must clear the board as fast as possible. To achieve such effect, set the following in `config.ts`: 

- `ballCount` to 80
- `createBallsOnMove` to `false`
- `disableMoveCollisions` to `true`
- `highlightPath` to `false` (optional)

<br>

To build, use `npm run build` in root directory. Output files will be located in `/public`.

*English localization coming soon*
