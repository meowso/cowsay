import fs from "fs";
import { spawn } from "node-pty";

const text = fs.readFileSync("dist/quote.txt", "utf8");
fs.writeFileSync("./dist/temp.txt", text);

let output = "";
const seed = Math.floor(Math.random() * 1000);
const ptyProcess = spawn(
  "npx",
  ["lolcatjs", "--seed", seed.toString(), "dist/temp.txt"],
  {}
);

ptyProcess.onData((data) => {
  output += data;
});

ptyProcess.onExit(() => {
  // Remove the specific sequence at the beginning and end of the output
  output = output.replace(
    /^[\x1b\x9B][\[0-9;]*[0-9A-Za-z]⠙|⠙[\x1b\x9B][\[0-9;]*[0-9A-Za-z]$/g,
    ""
  );

  fs.writeFileSync("./dist/lolcat.ansi", output);
  fs.unlinkSync("./dist/temp.txt");
});
