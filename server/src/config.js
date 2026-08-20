import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_CONFIG_PATH = resolve(__dirname, "../../config/orchestrator.config.json");

/**
 * Load the orchestrator configuration. The path can be overridden with the
 * ORCHESTRATOR_CONFIG environment variable so the same server can drive
 * different agent line-ups without code changes.
 */
export function loadConfig(configPath = process.env.ORCHESTRATOR_CONFIG || DEFAULT_CONFIG_PATH) {
  const raw = readFileSync(configPath, "utf8");
  const config = JSON.parse(raw);

  if (!Array.isArray(config.agents) || config.agents.length === 0) {
    throw new Error(`Config at ${configPath} must define a non-empty "agents" array`);
  }

  const seen = new Set();
  for (const agent of config.agents) {
    if (!agent.id) throw new Error("Every agent must have an id");
    if (seen.has(agent.id)) throw new Error(`Duplicate agent id: ${agent.id}`);
    seen.add(agent.id);
    agent.name ??= agent.id;
    agent.role ??= "";
    agent.emoji ??= "🤖";
    agent.heartbeatSeconds ??= 10;
  }

  config.console ??= {};
  config.console.name ??= "Agent Orchestrator Console";
  config.console.port = Number(process.env.PORT || config.console.port || 4000);

  return config;
}
