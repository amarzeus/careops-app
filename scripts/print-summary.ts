import fs from "fs";
import path from "path";

const SUMMARY_PATH = path.join(process.cwd(), "tests", "test-summary.md");

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  underline: "\x1b[4m",
  italic: "\x1b[3m",

  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  // High Intensity
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",

  // Background colors
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
  bgCyan: "\x1b[46m",
};

const SYMBOLS = {
  check: "✔",
  bullet: "•",
  info: "ℹ",
  arrow: "❯",
  star: "★",
  diamond: "◆",
  line: "─",
  thick_line: "━",
  corner_tl: "┏",
  corner_tr: "┓",
  corner_bl: "┗",
  corner_br: "┛",
  vertical: "┃",
};

function styleText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, `${COLORS.bold}${COLORS.white}$1${COLORS.reset}`)
    .replace(/__(.*?)__/g, `${COLORS.italic}$1${COLORS.reset}`);
}

function printSummary() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.log(
      `${COLORS.brightYellow}${SYMBOLS.info} Warning: ${SUMMARY_PATH} not found.${COLORS.reset}`
    );
    return;
  }

  const content = fs.readFileSync(SUMMARY_PATH, "utf-8");
  const lines = content.split("\n");

  const terminalWidth = process.stdout.columns || 80;
  const title = "🚀 CAREOPS TEST AUTOMATION DASHBOARD";
  const boxWidth = Math.max(title.length + 4, Math.min(80, terminalWidth - 4));

  const drawLine = (char: string = SYMBOLS.thick_line) => char.repeat(boxWidth);

  // --- Dashboard Header ---
  console.log(
    `\n${COLORS.brightCyan}${SYMBOLS.corner_tl}${drawLine()}${SYMBOLS.corner_tr}${COLORS.reset}`
  );

  const availableSpace = boxWidth;
  const paddingLeft = Math.max(0, Math.floor((availableSpace - title.length) / 2));
  const paddingRight = Math.max(0, availableSpace - title.length - paddingLeft);

  console.log(
    `${COLORS.brightCyan}${SYMBOLS.vertical}${COLORS.reset}${COLORS.bgBlue}${COLORS.white}${COLORS.bold}${" ".repeat(paddingLeft)}${title}${" ".repeat(paddingRight)}${COLORS.reset}${COLORS.brightCyan}${SYMBOLS.vertical}${COLORS.reset}`
  );

  console.log(
    `${COLORS.brightCyan}${SYMBOLS.corner_bl}${drawLine()}${SYMBOLS.corner_br}${COLORS.reset}\n`
  );

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // --- Main Sections (# Header) ---
    if (line.startsWith("# ")) {
      const header = line.replace("# ", "").toUpperCase();
      console.log(
        `\n${COLORS.bold}${COLORS.brightMagenta}${SYMBOLS.diamond} ${header}${COLORS.reset}`
      );
      console.log(
        `${COLORS.brightMagenta}${SYMBOLS.line.repeat(header.length + 2)}${COLORS.reset}`
      );
    }

    // --- Sub-sections (## Header) ---
    else if (line.startsWith("## ")) {
      console.log(
        `\n${COLORS.bold}${COLORS.brightBlue}${SYMBOLS.arrow} ${line.replace("## ", "")}${COLORS.reset}`
      );
    }

    // --- Categories (### Header) ---
    else if (line.startsWith("### ")) {
      console.log(
        `  ${COLORS.brightCyan}${SYMBOLS.bullet} ${line.replace("### ", "")}${COLORS.reset}`
      );
    }

    // --- Checkbox Items (- [x]) ---
    else if (line.includes("[x]")) {
      const task = line.replace("- [x] ", "").trim();
      const [fileName, ...descParts] = task.split(" - ");
      const description = descParts.join(" - ");

      console.log(
        `    ${COLORS.brightGreen}${SYMBOLS.check}${COLORS.reset} ${COLORS.bold}${fileName}${COLORS.reset}${
          description ? ` ${COLORS.gray}→ ${styleText(description)}${COLORS.reset}` : ""
        }`
      );
    }

    // --- Pending Items (- [ ]) ---
    else if (line.includes("[ ]")) {
      console.log(
        `    ${COLORS.gray}${SYMBOLS.bullet}${COLORS.reset} ${styleText(line.replace("- [ ] ", ""))}`
      );
    }

    // --- Status Lines (- **Key**: Value) ---
    else if (line.startsWith("- ")) {
      if (line.includes(":")) {
        const parts = line.split(":");
        const label = parts[0].replace("- ", "").replace(/\*\*/g, "");
        const value = parts.slice(1).join(":").trim();

        const cleanValue = value.replace(/\*\*/g, "");
        let coloredValue = styleText(value);
        const lowerValue = cleanValue.toLowerCase();

        if (lowerValue.includes("passing") || lowerValue.includes("success")) {
          coloredValue = `${COLORS.bgGreen}${COLORS.black}${COLORS.bold} PASSING ${COLORS.reset} ${COLORS.green}${cleanValue.replace(/Passing/i, "").trim()}${COLORS.reset}`;
        } else if (lowerValue.includes("flaky") || lowerValue.includes("warning")) {
          coloredValue = `${COLORS.bgYellow}${COLORS.black}${COLORS.bold} FLAKY  ${COLORS.reset} ${COLORS.yellow}${cleanValue.replace(/Flaky/i, "").trim()}${COLORS.reset}`;
        } else if (
          lowerValue.includes("failing") ||
          lowerValue.includes("failure") ||
          lowerValue.includes("error")
        ) {
          coloredValue = `${COLORS.bgRed}${COLORS.white}${COLORS.bold} FAILING ${COLORS.reset} ${COLORS.red}${cleanValue.replace(/Failing/i, "").trim()}${COLORS.reset}`;
        }

        console.log(`    ${COLORS.white}┣ ${COLORS.bold}${label}:${COLORS.reset} ${coloredValue}`);
      } else {
        console.log(`    ${COLORS.white}┣ ${COLORS.reset}${styleText(line.replace("- ", ""))}`);
      }
    }

    // --- General Text ---
    else {
      console.log(`      ${COLORS.gray}${styleText(trimmed)}${COLORS.reset}`);
    }
  });

  // --- Footer ---
  console.log(`\n${COLORS.brightCyan}${drawLine(SYMBOLS.thick_line)}${COLORS.reset}\n`);
}

printSummary();
