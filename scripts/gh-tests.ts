import { execSync } from "child_process";

/**
 * GitHub CLI Integration Tests
 * Verifies that the local environment is correctly connected to GitHub.
 */

function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: "utf-8", stdio: "pipe" });
  } catch (error: any) {
    return "";
  }
}

async function runGHTests() {
  console.log("\n🔍 Running GitHub CLI Integration Tests...");

  let allPassed = true;

  // 1. Check Auth Status
  process.stdout.write("  ❯ Checking GitHub Auth Status... ");
  const authStatus = runCommand("gh auth status");
  if (authStatus.includes("Logged in to github.com")) {
    console.log("✅");
  } else {
    console.log("❌");
    console.log("     Error: Not logged in to GitHub CLI. Run 'gh auth login'.");
    allPassed = false;
  }

  // 2. Check Repo Connection
  process.stdout.write("  ❯ Verifying Repository Access... ");
  const repoView = runCommand("gh repo view --json name,url");
  if (repoView.includes("careops-app")) {
    console.log("✅");
  } else {
    console.log("❌");
    console.log("     Error: Cannot access repository. Ensure you are in the correct directory.");
    allPassed = false;
  }

  // 3. Check Recent CI Runs
  process.stdout.write("  ❯ Checking Recent CI Run Status... ");
  const runList = runCommand("gh run list --limit 1 --json status,conclusion");
  if (runList) {
    try {
      const runs = JSON.parse(runList);
      if (runs.length > 0) {
        const lastRun = runs[0];
        if (lastRun.conclusion === "success" || lastRun.status === "in_progress") {
          console.log("✅");
        } else {
          console.log("⚠️");
          console.log(`     Warning: Last CI run finished with conclusion: ${lastRun.conclusion}`);
        }
      } else {
        console.log("ℹ️ (No runs found)");
      }
    } catch (e) {
      console.log("❌");
      allPassed = false;
    }
  } else {
    console.log("❌");
    allPassed = false;
  }

  if (!allPassed) {
    process.exit(1);
  }
  console.log("✅ All GitHub CLI tests passed!\n");
}

runGHTests();
