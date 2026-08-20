import { runOilDueListJob } from "./oil-change-job.js";

const result = runOilDueListJob();
process.stdout.write(`${result.summary}\n\n${result.report}\n`);
if (!result.review.ok) {
  process.stderr.write(`REVIEW REJECT: ${result.review.failures.join(", ")}\n`);
  process.exit(1);
}
