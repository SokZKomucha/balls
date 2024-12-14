const path = require("path");

module.exports = {
  module: {
    rules: [{
      test: /\.ts?$/,
      use: "ts-loader",
      exclude: /node_modules/
    }]
  },
  entry: "./src/main.ts",
  context: __dirname,
  mode: "production",
  resolve: { extensions: [".ts", ".js"] },
  output: {
    filename: "script.js",
    path: path.join(__dirname, "public")
  }
};