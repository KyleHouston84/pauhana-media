import { useState, useEffect, useRef } from "react";
import { getLogs } from "../api";

export function SystemLogs() {
  const [logs, setLogs] = useState<string>("");
  const [logLines, setLogLines] = useState<number>(100);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logsError, setLogsError] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isPinned = useRef(true);

  const fetchLogs = async () => {
    setLogsLoading(true);
    setLogsError("");
    try {
      const data = await getLogs(logLines);
      setLogs(data);
    } catch (err) {
      setLogsError("Failed to fetch logs");
      console.error("Failed to fetch logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRefreshLogs = () => {
    fetchLogs();
  };

  // Fetch logs on mount and when line count changes
  useEffect(() => {
    fetchLogs();
  }, [logLines]);

  // Auto-refresh logs
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, logLines]);

  // Scroll to bottom when logs update, if pinned
  useEffect(() => {
    if (isPinned.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
    isPinned.current = atBottom;
  };

  return (
    <div className="card logs-card">
      <h2>📋 System Logs</h2>

      <div className="logs-controls">
        <div className="logs-controls-left">
          <label htmlFor="log-lines">Lines:</label>
          <select
            id="log-lines"
            value={logLines}
            onChange={(e) => setLogLines(Number(e.target.value))}
            disabled={logsLoading}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>

          <button
            className="logs-button"
            onClick={handleRefreshLogs}
            disabled={logsLoading}
          >
            {logsLoading ? "Loading..." : "🔄 Refresh"}
          </button>
        </div>

        <label className="auto-refresh-toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span>Auto-refresh (5s)</span>
        </label>
      </div>

      {logsError && <div className="logs-error">{logsError}</div>}

      <div className="logs-container" ref={containerRef} onScroll={handleScroll}>
        <pre className="logs-content">{logs || "No logs available"}</pre>
      </div>
    </div>
  );
}
