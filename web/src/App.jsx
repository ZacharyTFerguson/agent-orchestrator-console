import React, { useCallback, useEffect, useRef, useState } from "react";

const api = (path, options) =>
  fetch(path, { headers: { "Content-Type": "application/json" }, ...options }).then((r) => {
    if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e.error || r.statusText)));
    return r.json();
  });

function sqliteToIso(value) {
  if (!value) return null;
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(value) || value.includes("T")) return value;
  return `${value.replace(" ", "T")}Z`;
}

function pushEvent(prev, event) {
  return [event, ...prev].slice(0, 40);
}

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
    api("/api/integrations").then(setIntegrations).catch(() => {});
    refreshAgents();
    refreshOil();

    Promise.all([api("/api/heartbeats"), api("/api/cron"), api("/api/messages")])
      .then(([heartbeats, crons, rows]) => {
        setMessages(rows);
        const tape = [
          ...heartbeats.map((row) => ({
            type: "heartbeat",
            agentId: row.agent_id,
            status: row.status,
            at: sqliteToIso(row.created_at),
          })),
          ...crons.map((row) => ({
            type: "cron",
            agentId: row.agent_id,
            task: row.task,
            status: row.status,
            at: sqliteToIso(row.created_at),
          })),
        ].sort((a, b) => Date.parse(b.at || 0) - Date.parse(a.at || 0));
        setEvents(tape.slice(0, 40));
      })
      .catch(() => {});

    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.type === "hello") {
        if (Array.isArray(data.agents)) setAgents(data.agents);
        return;
      }
      if (data.type === "message") {
        setMessages((prev) => [...prev, data.message]);
        setEvents((prev) =>
          pushEvent(prev, {
            type: "message",
            agentId: data.agentId || data.message?.sender,
            task: data.message?.text,
            status: data.message?.role,
            at: data.at,
          })
        );
        return;
      }
      if (data.type === "heartbeat" || data.type === "cron" || data.type === "oil") {
        setEvents((prev) => pushEvent(prev, data));
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

function formatAge(seconds) {
  if (seconds == null) return "never";
  if (seconds < 1) return "now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
}

function ageFromHeartbeat(iso, now) {
  if (!iso) return null;
  const stamp = Date.parse(sqliteToIso(iso));
  if (Number.isNaN(stamp)) return null;
  return Math.max(0, Math.round((now - stamp) / 1000));
}

function compactTape(events) {
  const actions = [];
  const pulses = [];
  const seenHeartbeat = new Set();
  for (const event of events) {
    if (event.type === "heartbeat") {
      if (seenHeartbeat.has(event.agentId)) continue;
      seenHeartbeat.add(event.agentId);
      pulses.push(event);
    } else {
      actions.push(event);
    }
  }
  return [...actions, ...pulses].slice(0, 12);
}

function eventDetail(event) {
  let raw = "";
  if (event.type === "message") raw = event.task || event.status || "";
  else if (event.type === "oil") raw = event.summary || event.task || event.status || "";
  else raw = event.task || event.status || "";
  if (raw.length > 80) return `${raw.slice(0, 77)}…`;
  return raw;
}

function WatchPanel({ agents, connected, events, oil, onRun }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onCount = agents.filter((a) => a.status === "alive").length;
  const offCount = agents.length - onCount;
  const latest = events[0];
  const tape = compactTape(events);
  const oilLine = oil?.payload?.summary || oil?.message || null;

  return (
    <section className="panel watch-panel">
      <div className="watch-head">
        <h2>Watch</h2>
        <p className="watch-meta">
          {onCount} on · {offCount} off · socket {connected ? "live" : "offline"}
          {latest ? ` · last ${latest.type} ${latest.agentId || ""}`.trim() : ""}
        </p>
      </div>
      <p className="watch-note">
        This console roster — who is on, last ping, last task, and the live tape.
        Not dicomlight Agent Control, YOLO, or OWNER-PAUSE.
      </p>
      {oilLine ? <p className="watch-oil">{oilLine}</p> : null}
      <div className="watch-body">
        <div className="watch-table-wrap">
          <table className="watch-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>On / off</th>
                <th>Last ping</th>
                <th>Schedule</th>
                <th>Last task</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const age = ageFromHeartbeat(agent.lastHeartbeat, now);
                const active = latest?.agentId === agent.id;
                return (
                  <tr key={agent.id} className={`${agent.status}${active ? " active" : ""}`}>
                    <td>
                      <span className="watch-name">
                        {agent.emoji} {agent.name}
                      </span>
                      <span className="watch-id">{agent.id}</span>
                    </td>
                    <td>
                      <span className={`watch-state ${agent.status}`}>
                        {agent.status === "alive" ? "on" : "off"}
                      </span>
                    </td>
                    <td>{formatAge(age)}</td>
                    <td>{agent.cron || `${agent.heartbeatSeconds}s ping`}</td>
                    <td className="watch-task">
                      <span className={agent.lastCronStatus === "error" ? "watch-error" : ""}>
                        {agent.lastCronTask || "—"}
                      </span>
                      {agent.lastCronStatus ? (
                        <span className="watch-cron-status">{agent.lastCronStatus}</span>
                      ) : null}
                    </td>
                    <td>
                      <button type="button" onClick={() => onRun(agent.id)}>
                        Run
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <aside className="watch-tape">
          <h3>Going on</h3>
          {tape.length === 0 ? (
            <p className="empty">Waiting for heartbeats, chat, and cron…</p>
          ) : (
            tape.map((event, i) => (
              <div key={`${event.type}-${event.at}-${i}`} className={`event ${event.type}`}>
                <span className="event-type">{event.type}</span>
                <span className="event-agent">{event.agentId || "—"}</span>
                <span className="event-detail">{eventDetail(event)}</span>
                <span className="event-time">
                  {event.at ? new Date(event.at).toLocaleTimeString() : ""}
                </span>
              </div>
            ))
          )}
        </aside>
      </div>
    </section>
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
        <WatchPanel agents={agents} connected={connected} events={events} oil={oil} onRun={runAgent} />

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
