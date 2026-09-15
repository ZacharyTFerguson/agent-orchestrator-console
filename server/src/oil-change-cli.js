import { runOilDueListJob } from "./oil-change-job.js";
import { integrationStatus } from "./clients/index.js";

async function main() {
  if (process.argv.includes("--integrations")) {
    process.stdout.write(`${JSON.stringify(integrationStatus(), null, 2)}\n`);
    return;
  }

  const result = await runOilDueListJob();
  process.stdout.write(`${result.summary}\n\n${result.report}\n`);
  if (!result.review.ok) {
    process.stderr.write(`REVIEW REJECT: ${result.review.failures.join(", ")}\n`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exitCode = 1;
});
