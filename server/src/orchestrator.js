import { EventEmitter } from "node:events";
import cron from "node-cron";

/**
 * Core orchestrator. Owns the agent line-up and drives three background
 * behaviours that are all persisted to SQLite and streamed to clients:
 *   - heartbeats: each agent emits a liveness ping on its own interval
 *   - cron: each agent runs a scheduled task on its cron expression
 *   - chat: user messages are routed to an agent which replies by role
 *
 * The orchestrator is an EventEmitter; the HTTP/WebSocket layer subscribes to
 * "event" to broadcast live updates to the console UI.
 */
export class Orchestrator extends EventEmitter {
  constructor(db, config) {
    super();
    this.db = db;
    this.config = config;
    this.agents = config.agents;
    this.heartbeatTimers = new Map();
    this.cronTasks = [];
    this.started = false;
    this.#syncAgents();
  }

  #syncAgents() {
    const upsert = this.db.prepare(`
      INSERT INTO agents (id, name, role, emoji, heartbeat_seconds)
      VALUES (@id, @name, @role, @emoji, @heartbeatSeconds)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        role = excluded.role,
        emoji = excluded.emoji,
        heartbeat_seconds = excluded.heartbeat_seconds
    `);
    const tx = this.db.transaction((agents) => {
      for (const agent of agents) upsert.run(agent);
    });
    tx(this.agents);
  }

  #emit(type, agentId, payload) {
    this.emit("event", { type, agentId, ...payload, at: new Date().toISOString() });
  }

  recordHeartbeat(agentId, status = "alive") {
    const info = this.db
      .prepare("INSERT INTO heartbeats (agent_id, status) VALUES (?, ?)")
      .run(agentId, status);
    this.#emit("heartbeat", agentId, { status, id: info.lastInsertRowid });
  }

  recordCronRun(agentId, task, status = "ok") {
    const info = this.db
      .prepare("INSERT INTO cron_runs (agent_id, task, status) VALUES (?, ?, ?)")
      .run(agentId, task, status);
    this.#emit("cron", agentId, { task, status, id: info.lastInsertRowid });
    return info.lastInsertRowid;
  }

  #saveMessage({ sender, agentId = null, role, text }) {
    const info = this.db
      .prepare("INSERT INTO messages (sender, agent_id, role, text) VALUES (?, ?, ?, ?)")
      .run(sender, agentId, role, text);
    return this.db.prepare("SELECT * FROM messages WHERE id = ?").get(info.lastInsertRowid);
  }

  /**
   * Route a user chat message to a target agent (or broadcast to all agents
   * when no agentId is given). Persists the inbound message and each agent
   * reply, and streams both over the event bus. Returns the created rows.
   */
  handleChat(text, agentId = null) {
    if (!text || !text.trim()) throw new Error("Message text is required");

    const targets = agentId ? this.agents.filter((a) => a.id === agentId) : this.agents;
    if (agentId && targets.length === 0) throw new Error(`Unknown agent: ${agentId}`);

    const userMessage = this.#saveMessage({
      sender: "user",
      agentId,
      role: "user",
      text: text.trim(),
    });
    this.#emit("message", agentId, { message: userMessage });

    const replies = targets.map((agent) => {
      const reply = this.#saveMessage({
        sender: agent.id,
        agentId: agent.id,
        role: "agent",
        text: this.#composeReply(agent, text.trim()),
      });
      this.#emit("message", agent.id, { message: reply });
      return reply;
    });

    return { userMessage, replies };
  }

  #composeReply(agent, text) {
    return `${agent.emoji} ${agent.name} here. On it — as the agent that ${agent.role.replace(/\.$/, "").toLowerCase()}, I'll handle: "${text}".`;
  }

  start() {
    if (this.started) return;
    this.started = true;

    for (const agent of this.agents) {
      this.recordHeartbeat(agent.id);
      const intervalMs = Math.max(1, agent.heartbeatSeconds) * 1000;
      const timer = setInterval(() => this.recordHeartbeat(agent.id), intervalMs);
      if (typeof timer.unref === "function") timer.unref();
      this.heartbeatTimers.set(agent.id, timer);

      if (agent.cron && cron.validate(agent.cron)) {
        const task = cron.schedule(agent.cron, () => {
          this.recordCronRun(agent.id, agent.cronTask || "Scheduled run");
        });
        this.cronTasks.push(task);
      }
    }
  }

  stop() {
    for (const timer of this.heartbeatTimers.values()) clearInterval(timer);
    this.heartbeatTimers.clear();
    for (const task of this.cronTasks) task.stop();
    this.cronTasks = [];
    this.started = false;
  }

  /** Snapshot of every agent plus derived liveness from the latest heartbeat. */
  getAgentStatus() {
    const rows = this.db
      .prepare(
        `SELECT a.*, (
           SELECT created_at FROM heartbeats h
           WHERE h.agent_id = a.id ORDER BY h.id DESC LIMIT 1
         ) AS last_heartbeat
         FROM agents a ORDER BY a.name`
      )
      .all();

    const now = Date.now();
    return rows.map((row) => {
      const last = row.last_heartbeat ? Date.parse(row.last_heartbeat + "Z") : null;
      const ageSeconds = last ? Math.round((now - last) / 1000) : null;
      const stale = ageSeconds == null || ageSeconds > row.heartbeat_seconds * 3;
      return {
        id: row.id,
        name: row.name,
        role: row.role,
        emoji: row.emoji,
        heartbeatSeconds: row.heartbeat_seconds,
        lastHeartbeat: row.last_heartbeat,
        secondsSinceHeartbeat: ageSeconds,
        status: stale ? "stale" : "alive",
      };
    });
  }

  getMessages(limit = 100) {
    return this.db
      .prepare("SELECT * FROM messages ORDER BY id DESC LIMIT ?")
      .all(limit)
      .reverse();
  }

  getCronRuns(limit = 50) {
    return this.db.prepare("SELECT * FROM cron_runs ORDER BY id DESC LIMIT ?").all(limit);
  }

  getHeartbeats(limit = 50) {
    return this.db.prepare("SELECT * FROM heartbeats ORDER BY id DESC LIMIT ?").all(limit);
  }
}
