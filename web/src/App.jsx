import React, { useCallback, useEffect, useRef, useState } from "react";

const api = (path, options) =>
  fetch(path, { headers: { "Content-Type": "application/json" }, ...options }).then((r) => {
    if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e.error || r.statusText)));
    return r.json();
  });

function useOrchestrator() {
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [oil, setOil] = useState(null);
  const [integrations, setIntegrations] = useState(null);
  const [connected, setConnected] = useState(false);

  const refreshAgents = useCallback(() => api("/api/agents").then(setAgents).catch(() => {}), []);
  const refreshOil = useCallback(
    () => api("/api/oil-changes").then(setOil).catch(() => {}),
    []
  );

  useEffect(() => {
    api("/api/messages").then(setMessages).catch(() => {});
    api("/api/integrations").then(setIntegrations).catch(() => {});
    refreshAgents();
    refreshOil();

    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.type === "message") {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "heartbeat" || data.type === "cron" || data.type === "oil") {
        setEvents((prev) => [data, ...prev].slice(0, 40));
        refreshAgents();
        if (data.type === "oil" || data.type === "cron") refreshOil();
      }
    };
    const poll = setInterval(refreshAgents, 5000);
    return () => {
      ws.close();
      clearInterval(poll);
    };
  }, [refreshAgents, refreshOil]);

  return { agents, messages, events, oil, integrations, connected, refreshAgents, refreshOil };
}

function AgentCard({ agent, onRun }) {
  return (
    <div className={`agent-card ${agent.status}`}>
      <div className="agent-head">
        <span className="agent-emoji">{agent.emoji}</span>
        <span className="agent-name">{agent.name}</span>
        <span className={`dot ${agent.status}`} title={agent.status} />
      </div>
      <p className="agent-role">{agent.role}</p>
      <div className="agent-foot">
        <span>
          {agent.status === "alive" ? "alive" : "stale"} ·{" "}
          {agent.secondsSinceHeartbeat == null ? "—" : `${agent.secondsSinceHeartbeat}s ago`}
        </span>
        <button onClick={() => onRun(agent.id)}>Run task</button>
      </div>
    </div>
  );
}

export default function App() {
  const { agents, messages, events, oil, integrations, connected, refreshAgents, refreshOil } = useOrchestrator();
  const [text, setText] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    try {
      await api("/api/chat", {
        method: "POST",
        body: JSON.stringify({ text, agentId: target || null }),
      });
      setText("");
    } catch (err) {
      setError(err.message);
    }
  };

  const runAgent = async (id) => {
    await api(`/api/agents/${id}/run`, { method: "POST" }).catch(() => {});
    refreshAgents();
    refreshOil();
  };

  const runOil = async () => {
    setError("");
    try {
      await api("/api/oil-changes/run", { method: "POST" });
      refreshOil();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">◎</span>
          <h1>Agent Orchestrator Console</h1>
        </div>
        <span className={`conn ${connected ? "on" : "off"}`}>
          {connected ? "live" : "offline"}
        </span>
      </header>

      <main className="layout">
        <section className="panel agents-panel">
          <h2>Agents</h2>
          <div className="agents-grid">
            {agents.map((a) => (
              <AgentCard key={a.id} agent={a} onRun={runAgent} />
            ))}
          </div>
        </section>

        <section className="panel chat-panel">
          <h2>Chat</h2>
          <div className="feed" ref={feedRef}>
            {messages.length === 0 && <p className="empty">No messages yet. Say hello to your agents.</p>}
            {messages.map((m) => (
              <div key={m.id} className={`bubble ${m.role}`}>
                <span className="bubble-sender">{m.sender}</span>
                <span className="bubble-text">{m.text}</span>
              </div>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <form className="composer" onSubmit={send}>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">All agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Send a message to your agents…"
            />
            <button type="submit">Send</button>
          </form>
        </section>

        <section className="panel events-panel">
          <h2>Activity</h2>
          <div className="events">
            {events.length === 0 && <p className="empty">Waiting for heartbeats and cron runs…</p>}
            {events.map((ev, i) => (
              <div key={i} className={`event ${ev.type}`}>
                <span className="event-type">{ev.type}</span>
                <span className="event-agent">{ev.agentId}</span>
                <span className="event-detail">{ev.task || ev.status}</span>
                <span className="event-time">{new Date(ev.at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel oil-panel">
          <h2>Oil changes</h2>
          <div className="oil-head">
            <p className="oil-summary">
              {oil?.payload?.summary || oil?.message || "No due-list yet. This console owns the job GrokBot used to email."}
            </p>
            <button onClick={runOil}>Run due-list</button>
          </div>
          {integrations && (
            <div className="oil-integrations" title="Light API clients — no Chrome, no googleapis">
              <span className={integrations.sheets?.configured ? "on" : "off"}>Sheets</span>
              <span className={integrations.onestep?.configured ? "on" : "off"}>OneStep</span>
              <span className="off">eFleets export</span>
            </div>
          )}
          {oil?.payload?.counts && (
            <div className="oil-counts">
              <span>{oil.payload.counts.overdue} overdue</span>
              <span>{oil.payload.counts.suspect} suspect</span>
              <span>{oil.payload.counts.backward} backward</span>
            </div>
          )}
          <pre className="oil-report">{oil?.report || ""}</pre>
        </section>
      </main>
    </div>
  );
}
