import fs from "fs";
import path from "path";

const SUMMARY_PATH = path.join(process.cwd(), "tests", "test-summary.md");

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  bgBlue: "\x1b[44m",
};

function printSummary() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.log(`${COLORS.yellow}Warning: ${SUMMARY_PATH} not found.${COLORS.reset}`);
    return;
  }

  const content = fs.readFileSync(SUMMARY_PATH, "utf-8");
  const lines = content.split("\n");

  console.log(
    `\n${COLORS.bold}${COLORS.magenta}╔════════════════════════════════════════════════════════════╗${COLORS.reset}`
  );
  console.log(
    `${COLORS.bold}${COLORS.magenta}║${COLORS.bgBlue}${COLORS.white}                🚀 CAREOPS TEST AUTOMATION                  ${COLORS.reset}${COLORS.bold}${COLORS.magenta}║${COLORS.reset}`
  );
  console.log(
    `${COLORS.bold}${COLORS.magenta}╚════════════════════════════════════════════════════════════╝${COLORS.reset}\n`
  );

  lines.forEach((line) => {
    // Headers
    if (line.startsWith("# ")) {
      console.log(
        `${COLORS.bold}${COLORS.magenta}${line.replace("# ", "").toUpperCase()}${COLORS.reset}`
      );
    } else if (line.startsWith("## ")) {
      console.log(`\n${COLORS.bold}${COLORS.blue}${line.replace("## ", "🔹 ")}${COLORS.reset}`);
    } else if (line.startsWith("### ")) {
      console.log(`  ${COLORS.bold}${COLORS.cyan}${line.replace("### ", "📍 ")}${COLORS.reset}`);
    }
    // Checkboxes
    else if (line.includes("[x]")) {
      console.log(`    ${COLORS.green}✔${COLORS.reset} ${line.replace("- [x] ", "")}`);
    } else if (line.includes("[ ]")) {
      console.log(`    ${COLORS.gray}○${COLORS.reset} ${line.replace("- [ ] ", "")}`);
    }
    // Lists and Execution Status
    else if (line.startsWith("- ")) {
      if (line.includes(":")) {
        const parts = line.split(":");
        const label = parts[0].replace("- ", "");
        const value = parts.slice(1).join(":");
        let coloredValue = value;

        if (value.toLowerCase().includes("passing")) {
          coloredValue = `${COLORS.green}${COLORS.bold}${value}${COLORS.reset}`;
        } else if (value.toLowerCase().includes("flaky")) {
          coloredValue = `${COLORS.yellow}${value}${COLORS.reset}`;
        }

        console.log(
          `    ${COLORS.yellow}•${COLORS.reset} ${COLORS.bold}${label}:${COLORS.reset}${coloredValue}`
        );
      } else {
        console.log(`    ${COLORS.yellow}•${COLORS.reset} ${line.replace("- ", "")}`);
      }
    }
    // Plain text
    else if (line.trim()) {
      let styledLine = line.trim();
      // Highlight bold text in markdown
      if (styledLine.includes("**")) {
        styledLine = styledLine.replace(
          /\*\*(.*?)\*\*/g,
          `${COLORS.bold}${COLORS.white}$1${COLORS.reset}`
        );
      }
      console.log(`    ${styledLine}`);
    }
  });

  console.log(
    `\n${COLORS.bold}${COLORS.cyan}══════════════════════════════════════════════════════════════${COLORS.reset}\n`
  );
}

printSummary();
