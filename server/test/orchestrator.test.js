import { test } from "node:test";
import assert from "node:assert/strict";

import { openDatabase } from "../src/db.js";
import { Orchestrator } from "../src/orchestrator.js";

function makeOrchestrator() {
  const db = openDatabase(":memory:");
  const config = {
    console: { name: "Test Console", port: 0 },
    agents: [
      { id: "planner", name: "Planner", role: "Plans things.", emoji: "🗺️", heartbeatSeconds: 5 },
      { id: "executor", name: "Executor", role: "Executes things.", emoji: "⚙️", heartbeatSeconds: 5 },
      {
        id: "oil-updater",
        name: "Oil Change Updater",
        role: "Builds the 5K oil due-list.",
        emoji: "🛢️",
        heartbeatSeconds: 5,
        job: "oil-due-list",
        cronTask: "Build the oil due-list",
      },
    ],
  };
  return new Orchestrator(db, config);
}

test("agents are persisted on construction", () => {
  const orch = makeOrchestrator();
  const agents = orch.getAgentStatus();
  assert.equal(agents.length, 3);
  assert.deepEqual(
    agents.map((a) => a.id).sort(),
    ["executor", "oil-updater", "planner"]
  );
});

test("chat to a specific agent persists user message and one reply", () => {
  const orch = makeOrchestrator();
  const { userMessage, replies } = orch.handleChat("status?", "planner");
  assert.equal(userMessage.text, "status?");
  assert.equal(replies.length, 1);
  assert.equal(replies[0].agent_id, "planner");
  assert.match(replies[0].text, /Planner/);

  const messages = orch.getMessages();
  assert.equal(messages.length, 2);
});

test("broadcast chat replies from every agent", () => {
  const orch = makeOrchestrator();
  const { replies } = orch.handleChat("hello all");
  assert.equal(replies.length, 3);
});

test("empty chat text is rejected", () => {
  const orch = makeOrchestrator();
  assert.throws(() => orch.handleChat("   "), /required/);
});

test("unknown agent is rejected", () => {
  const orch = makeOrchestrator();
  assert.throws(() => orch.handleChat("hi", "ghost"), /Unknown agent/);
});

test("heartbeats are recorded and reflected in status", () => {
  const orch = makeOrchestrator();
  orch.recordHeartbeat("planner");
  const planner = orch.getAgentStatus().find((a) => a.id === "planner");
  assert.equal(planner.status, "alive");
  assert.ok(orch.getHeartbeats().length >= 1);
});

test("cron runs are recorded", () => {
  const orch = makeOrchestrator();
  orch.recordCronRun("executor", "do the thing");
  const runs = orch.getCronRuns();
  assert.equal(runs[0].agent_id, "executor");
  assert.equal(runs[0].task, "do the thing");
});

test("oil-updater run persists a due-list report", () => {
  const orch = makeOrchestrator();
  const { result } = orch.runAgentTask("oil-updater");
  assert.ok(result.counts.overdue >= 1);
  assert.equal(result.review.ok, true);
  const latest = orch.getLatestOilReport();
  assert.match(latest.report, /Change oil \(overdue\)/);
  const runs = orch.getCronRuns();
  assert.match(runs[0].task, /overdue/);
});

test("oil-change chat returns the due list instead of a canned template", () => {
  const orch = makeOrchestrator();
  const { replies } = orch.handleChat("How are the vehicles looking today?", "oil-updater");
  assert.match(replies[0].text, /Took this over from GrokBot/);
  assert.match(replies[0].text, /Change oil \(overdue\)/);
});

test("events are emitted for chat, heartbeat and cron", () => {
  const orch = makeOrchestrator();
  const types = [];
  orch.on("event", (e) => types.push(e.type));
  orch.recordHeartbeat("planner");
  orch.recordCronRun("planner", "task");
  orch.handleChat("hi", "planner");
  assert.ok(types.includes("heartbeat"));
  assert.ok(types.includes("cron"));
  assert.ok(types.includes("message"));
});
