import Convert from "ansi-to-html";
import * as cowsay from "cowsay";
import * as fs from "fs";
import nodeHtmlToImage from "node-html-to-image";
import { spawn } from "node-pty";
import * as path from "path";
import wrap from "word-wrap";

// Define the path to the dist directory
const distDir = path.resolve(__dirname, "..", "dist");
const srcDir = path.resolve(__dirname, "..", "src");

// Read the quotes from the JSON file
const quotes: string[] = JSON.parse(
  fs.readFileSync(path.join(srcDir, "tech_quotes.json"), "utf-8")
);

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

quotes.forEach(async (quote, index) => {
  if (index > 0) {
    return;
  }
  // Generate the cowsay message
  if (!fs.existsSync(path.join(distDir, `quote-${index}.txt`))) {
    const message = cowsayQuote(quote);
    // Print the message to a file in rich text format
    fs.writeFileSync(path.join(distDir, `quote-${index}.txt`), message + "\n");
  }

  if (!fs.existsSync(path.join(distDir, `quote-${index}.ansi`))) {
    // Apply lolcat on the generated quote file
    applyLolcat(`quote-${index}.txt`);
  }

  // if (!fs.existsSync(path.join(distDir, `quote-${index}.html`))) {
  //   convertToHtml(`quote-${index}.ansi`);
  // }
  // // Convert the quote to an image
  // if (!fs.existsSync(path.join(distDir, `quote-${index}.png`))) {
  //   convertToImage(`quote-${index}.html`);
  // }
});

function cowsayQuote(quote: string) {
  const wrappedQuote = wrap(quote, {
    width: 40,
    indent: "",
    trim: true,
    cut: false,
    newline: "\n",
    escape: (str: string) => str,
  });

  // Generate the cowsay message
  return cowsay.say({ text: wrappedQuote });
}

// Function to apply lolcat on the generated quote file
function applyLolcat(fileName: string) {
  const filePath = path.join(distDir, fileName);
  let output = "";
  const seed = Math.floor(Math.random() * 1000);
  const ptyProcess = spawn(
    "npx",
    ["lolcatjs", "--seed", seed.toString(), filePath],
    {}
  );

  ptyProcess.onData((data) => {
    output += data;
  });

  ptyProcess.onExit(() => {
    // output = output.replace(/\x1b\[\?25h/g, "");
    // output = output.replace(/⠙/g, ""); // Add this line to remove the character ⠙
    // regex to remove this character [1G[0K⠙[1G[0K
    output = output.replace(/\x1b\[1G\x1b\[0K⠙\x1b\[1G\x1b\[0K/g, "");
    const lolcatFileName = fileName.replace(".txt", ".ansi");
    fs.writeFileSync(path.join(distDir, lolcatFileName), output);
  });
}

function convertToHtml(fileName: string) {
  const convert = new Convert({ newline: true });

  // Read the ANSI string from src/quote.txt
  let ansiString = fs.readFileSync(path.join(distDir, fileName), "utf-8");

  // Convert ANSI to HTML
  let html = convert.toHtml(ansiString);

  // Read the CSS from style.css
  let css = fs.readFileSync(path.join(srcDir, "style.css"), "utf-8");

  // Add CSS and external links to the HTML
  html = `
  <style>${css}</style>
  <div class="container"><pre>${html}</pre></div>
`;
  // Write the HTML
  const htmlFileName = fileName.replace(".ansi", ".html");
  fs.writeFileSync(path.join(distDir, htmlFileName), html);
}

function convertToImage(fileName: string) {
  // Convert HTML to PNG
  const outputFileName = fileName.replace(".html", ".png");
  const html = fs.readFileSync(path.join(distDir, fileName), "utf-8");
  nodeHtmlToImage({
    output: path.join(distDir, outputFileName),
    html,
    puppeteerArgs: {
      defaultViewport: {
        width: 1600 * 0.75, // Set the width of the image
        height: 900 * 0.75, // Set the height of the image
      },
    },
  })
    .then()
    .catch((error) => console.error("oops, something went wrong!", error));
}
