import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

import { loadConfig } from "./config.js";
import { openDatabase } from "./db.js";
import { Orchestrator } from "./orchestrator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(orchestrator) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, name: orchestrator.config.console.name, agents: orchestrator.agents.length });
  });

  app.get("/api/config", (_req, res) => {
    res.json({ console: orchestrator.config.console, agents: orchestrator.getAgentStatus() });
  });

  app.get("/api/agents", (_req, res) => res.json(orchestrator.getAgentStatus()));
  app.get("/api/messages", (_req, res) => res.json(orchestrator.getMessages()));
  app.get("/api/cron", (_req, res) => res.json(orchestrator.getCronRuns()));
  app.get("/api/heartbeats", (_req, res) => res.json(orchestrator.getHeartbeats()));
  app.get("/api/oil-changes", (_req, res) => {
    const latest = orchestrator.getLatestOilReport();
    res.json(latest ?? { report: null, message: "No oil-change run yet. Trigger oil-updater." });
  });
  app.post("/api/oil-changes/run", (_req, res) => {
    try {
      const result = orchestrator.runAgentTask("oil-updater");
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/chat", (req, res) => {
    try {
      const { text, agentId } = req.body ?? {};
      const result = orchestrator.handleChat(text, agentId || null);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/agents/:id/run", (req, res) => {
    try {
      const result = orchestrator.runAgentTask(req.params.id);
      res.status(201).json(result);
    } catch (err) {
      const status = /Unknown agent/.test(err.message) ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  });

  const webDist = resolve(__dirname, "../../web/dist");
  if (existsSync(webDist)) {
    app.use(express.static(webDist));
    app.use((req, res, next) => {
      if (req.method !== "GET") return next();
      res.sendFile(resolve(webDist, "index.html"));
    });
  }

  return app;
}

export function startServer() {
  const config = loadConfig();
  const db = openDatabase();
  const orchestrator = new Orchestrator(db, config);
  const app = createApp(orchestrator);
  const server = createServer(app);

  const wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "hello", agents: orchestrator.getAgentStatus(), at: new Date().toISOString() }));
  });
  orchestrator.on("event", (event) => {
    const data = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(data);
    }
  });

  orchestrator.start();
  server.listen(config.console.port, () => {
    console.log(`[orchestrator] ${config.console.name} listening on http://localhost:${config.console.port}`);
  });

  return { server, orchestrator, db, wss };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
