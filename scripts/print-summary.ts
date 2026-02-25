import fs from "fs";
import path from "path";

const SUMMARY_PATH = path.join(process.cwd(), "tests", "test-summary.md");

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  underline: "\x1b[4m",

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

  // Background colors
  bgBlue: "\x1b[44m",
  bgCyan: "\x1b[46m",
  bgMagenta: "\x1b[45m",
  bgGreen: "\x1b[42m",
};

const SYMBOLS = {
  check: "✔",
  bullet: "•",
  info: "ℹ",
  arrow: "➜",
  empty: "○",
  line: "─",
  corner_tl: "┌",
  corner_tr: "┐",
  corner_bl: "└",
  corner_br: "┘",
  vertical: "│",
};

function printSummary() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.log(
      `${COLORS.yellow}${SYMBOLS.info} Warning: ${SUMMARY_PATH} not found.${COLORS.reset}`
    );
    return;
  }

  const content = fs.readFileSync(SUMMARY_PATH, "utf-8");
  const lines = content.split("\n");

  const terminalWidth = process.stdout.columns || 80;
  const boxWidth = Math.min(70, terminalWidth - 4);

  const drawLine = (char: string = SYMBOLS.line) => char.repeat(boxWidth);

  console.log(
    `\n${COLORS.bold}${COLORS.cyan}${SYMBOLS.corner_tl}${drawLine()}${SYMBOLS.corner_tr}${COLORS.reset}`
  );
  console.log(
    `${COLORS.bold}${COLORS.cyan}${SYMBOLS.vertical}${COLORS.reset}${COLORS.bgBlue}${COLORS.white}${COLORS.bold}${" ".repeat(Math.max(0, Math.floor((boxWidth - 36) / 2)))}🚀 CAREOPS TEST AUTOMATION DASHBOARD ${" ".repeat(Math.max(0, Math.ceil((boxWidth - 36) / 2)))}${COLORS.reset}${COLORS.bold}${COLORS.cyan}${SYMBOLS.vertical}${COLORS.reset}`
  );
  console.log(
    `${COLORS.bold}${COLORS.cyan}${SYMBOLS.corner_bl}${drawLine()}${SYMBOLS.corner_br}${COLORS.reset}\n`
  );

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed && line !== "\n") return;

    // Main Headers (# Header)
    if (line.startsWith("# ")) {
      const header = line.replace("# ", "").toUpperCase();
      console.log(`\n${COLORS.bold}${COLORS.underline}${COLORS.magenta}${header}${COLORS.reset}`);
      console.log(`${COLORS.magenta}${SYMBOLS.line.repeat(header.length)}${COLORS.reset}`);
    }
    // Sub headers (## Header)
    else if (line.startsWith("## ")) {
      console.log(
        `\n${COLORS.bold}${COLORS.blue}${SYMBOLS.arrow} ${line.replace("## ", "")}${COLORS.reset}`
      );
    }
    // Section headers (### Header)
    else if (line.startsWith("### ")) {
      console.log(
        `  ${COLORS.bold}${COLORS.cyan}${SYMBOLS.bullet} ${line.replace("### ", "")}${COLORS.reset}`
      );
    }
    // Completed tasks (- [x])
    else if (line.includes("[x]")) {
      const task = line.replace("- [x] ", "").trim();
      const [fileName, ...descParts] = task.split(" - ");
      const description = descParts.join(" - ");

      console.log(
        `    ${COLORS.green}${SYMBOLS.check}${COLORS.reset} ${COLORS.bold}${fileName}${COLORS.reset}${description ? ` ${COLORS.gray}─ ${description}${COLORS.reset}` : ""}`
      );
    }
    // Pending tasks (- [ ])
    else if (line.includes("[ ]")) {
      console.log(
        `    ${COLORS.gray}${SYMBOLS.empty}${COLORS.reset} ${line.replace("- [ ] ", "")}`
      );
    }
    // Execution Status / Key Value Pairs (- **Key**: Value)
    else if (line.startsWith("- ")) {
      if (line.includes(":")) {
        const parts = line.split(":");
        const label = parts[0].replace("- ", "").replace(/\*\*/g, "");
        const value = parts.slice(1).join(":").trim();
        let coloredValue = value;

        if (value.toLowerCase().includes("passing")) {
          coloredValue = `${COLORS.green}${COLORS.bold}${value}${COLORS.reset}`;
        } else if (value.toLowerCase().includes("flaky")) {
          coloredValue = `${COLORS.yellow}${value}${COLORS.reset}`;
        } else if (value.toLowerCase().includes("failing")) {
          coloredValue = `${COLORS.red}${COLORS.bold}${value}${COLORS.reset}`;
        }

        console.log(
          `    ${COLORS.yellow}${SYMBOLS.bullet}${COLORS.reset} ${COLORS.bold}${label}:${COLORS.reset} ${coloredValue}`
        );
      } else {
        console.log(
          `    ${COLORS.yellow}${SYMBOLS.bullet}${COLORS.reset} ${line.replace("- ", "")}`
        );
      }
    }
    // General text
    else {
      let styledLine = trimmed;
      if (styledLine.includes("**")) {
        styledLine = styledLine.replace(
          /\*\*(.*?)\*\*/g,
          `${COLORS.bold}${COLORS.white}$1${COLORS.reset}`
        );
      }
      console.log(`    ${COLORS.gray}${styledLine}${COLORS.reset}`);
    }
  });

  console.log(`\n${COLORS.bold}${COLORS.cyan}${drawLine("═")}${COLORS.reset}\n`);
}

printSummary();
