import fs from "fs";
import path from "path";

const SUMMARY_PATH = path.join(process.cwd(), "tests", "test-summary.md");

const C = {
  R: "\x1b[0m", // Reset
  B: "\x1b[1m", // Bold
  D: "\x1b[2m", // Dim
  U: "\x1b[4m", // Underline
  Blk: "\x1b[30m", // Black
  Red: "\x1b[31m", // Red
  Grn: "\x1b[32m", // Green
  Yel: "\x1b[33m", // Yellow
  Blu: "\x1b[34m", // Blue
  Mag: "\x1b[35m", // Magenta
  Cyn: "\x1b[36m", // Cyan
  Wht: "\x1b[37m", // White
  BgBlk: "\x1b[40m", // Background Black
  BgRed: "\x1b[41m", // Background Red
  BgGrn: "\x1b[42m", // Background Green
  BgYel: "\x1b[43m", // Background Yellow
  BgBlu: "\x1b[44m", // Background Blue
  BgMag: "\x1b[45m", // Background Magenta
  BgCyn: "\x1b[46m", // Background Cyan
  BgWht: "\x1b[47m", // Background White
};

const S = {
  check: "✅",
  cross: "❌",
  warn: "⚠️",
  info: "💡",
  bullet: "🔸",
  arrow: "➜",
  rocket: "🚀",
  shield: "🛡️",
  sparkle: "✨",
  box_tl: "╔",
  box_tr: "╗",
  box_bl: "╚",
  box_br: "╝",
  box_h: "═",
  box_v: "║",
  div_l: "╟",
  div_r: "╢",
  div_h: "─",
};

function styleMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, `${C.B}${C.Wht}$1${C.R}`)
    .replace(/__(.*?)__/g, `${C.U}$1${C.R}`)
    .replace(/`(.*?)`/g, `${C.Cyn}$1${C.R}`);
}

function printCenter(text: string, width: number) {
  const cleanLen = text.replace(/\x1b\[[0-9;]*m/g, "").length;
  const pad = Math.max(0, Math.floor((width - cleanLen) / 2));
  return " ".repeat(pad) + text + " ".repeat(Math.max(0, width - cleanLen - pad));
}

function printSummary() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.log(`${C.Yel}${S.warn} Warning: ${SUMMARY_PATH} not found.${C.R}`);
    return;
  }

  const content = fs.readFileSync(SUMMARY_PATH, "utf-8");
  const lines = content.split("\n");

  const width = Math.min(120, process.stdout.columns || 120);
  const borderH = S.box_h.repeat(width - 2);
  const divH = S.div_h.repeat(width - 2);

  console.log("\n");
  console.log(`${C.Cyn}${S.box_tl}${borderH}${S.box_tr}${C.R}`);
  console.log(
    `${C.Cyn}${S.box_v}${C.R}${printCenter(
      `${C.BgBlu}${C.Wht}${C.B} ${S.rocket} CAREOPS AUTOMATED TEST REPORT ${S.rocket} ${C.R}`,
      width - 2
    )}${C.Cyn}${S.box_v}${C.R}`
  );
  console.log(`${C.Cyn}${S.box_bl}${borderH}${S.box_br}${C.R}\n`);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      console.log("");
      return;
    }

    if (line.startsWith("# ")) {
      // Ignored since we have our massive banner
    } else if (line.startsWith("## ")) {
      const header = line.replace("## ", "").toUpperCase();
      let icon = S.sparkle;
      if (header.includes("STATUS")) icon = S.shield;
      if (header.includes("COVERAGE")) icon = "📊";

      console.log(`${C.B}${C.Mag}${icon} ${header} ${icon}${C.R}`);
      console.log(`${C.D}${divH}${C.R}`);
    } else if (line.startsWith("### ")) {
      console.log(`  ${C.B}${C.Blu}${line.replace("### ", "")}${C.R}`);
    } else if (line.includes("- [x]")) {
      const task = line.replace("- [x] ", "").trim();
      const parts = task.split(" - ");
      const fileName = parts[0];
      const desc = parts.slice(1).join(" - ");
      console.log(
        `    ${C.Grn}${S.check}${C.R}  ${C.Cyn}${fileName}${C.R}${desc ? ` ${C.D}${S.arrow} ${styleMarkdown(desc)}${C.R}` : ""}`
      );
    } else if (line.includes("- [ ]")) {
      const task = line.replace("- [ ] ", "").trim();
      const parts = task.split(" - ");
      const fileName = parts[0];
      const desc = parts.slice(1).join(" - ");
      console.log(
        `    ${C.Yel}⏳${C.R}  ${C.Yel}${fileName}${C.R}${desc ? ` ${C.D}${S.arrow} ${styleMarkdown(desc)}${C.R}` : ""}`
      );
    } else if (line.startsWith("- ")) {
      if (line.includes(":")) {
        const parts = line.split(":");
        const label = parts[0].replace("- ", "").replace(/\*\*/g, "").trim();
        const rawValue = parts.slice(1).join(":").trim();
        const valueStr = styleMarkdown(rawValue);

        let badge = "";
        let color = C.Wht;

        if (
          rawValue.toLowerCase().includes("passing") ||
          rawValue.toLowerCase().includes("success")
        ) {
          badge = `${C.BgGrn}${C.Blk}${C.B} PASS ${C.R}`;
          color = C.Grn;
        } else if (
          rawValue.toLowerCase().includes("pending") ||
          rawValue.toLowerCase().includes("warning")
        ) {
          badge = `${C.BgYel}${C.Blk}${C.B} WARN ${C.R}`;
          color = C.Yel;
        } else if (
          rawValue.toLowerCase().includes("failing") ||
          rawValue.toLowerCase().includes("error")
        ) {
          badge = `${C.BgRed}${C.Wht}${C.B} FAIL ${C.R}`;
          color = C.Red;
        }

        const formattedLabel = `${C.B}${C.Wht}${label}:${C.R}`.padEnd(
          30 + C.B.length + C.Wht.length + C.R.length
        );

        if (badge) {
          console.log(
            `  ${S.bullet} ${formattedLabel} ${badge} ${color}${rawValue.replace(/\*\*[^*]*\*\*/g, "").trim()}${C.R}`
          );
        } else {
          console.log(`  ${S.bullet} ${formattedLabel} ${valueStr}`);
        }
      } else {
        console.log(`  ${S.bullet} ${styleMarkdown(line.replace("- ", ""))}`);
      }
    } else {
      console.log(`  ${C.D}${styleMarkdown(trimmed)}${C.R}`);
    }
  });

  console.log(`\n${C.Cyn}${S.box_tl}${borderH}${S.box_tr}${C.R}`);
  console.log(
    `${C.Cyn}${S.box_v}${C.R}${printCenter(
      `${C.Grn}${C.B}ALL CHECKS COMPLETED${C.R}`,
      width - 2
    )}${C.Cyn}${S.box_v}${C.R}`
  );
  console.log(`${C.Cyn}${S.box_bl}${borderH}${S.box_br}${C.R}\n`);
}

printSummary();
