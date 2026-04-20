import { useState, useEffect } from "react";
import {
  getEffectLibrary,
  captureDeviceEffect,
  updateEffectInLibrary,
  deleteEffectFromLibrary,
} from "../api";
import type { StoredEffect, WLEDDeviceInfo } from "../api";

interface EffectLibrarySectionProps {
  devices: WLEDDeviceInfo[];
}

export function EffectLibrarySection({ devices }: EffectLibrarySectionProps) {
  const [effects, setEffects] = useState<Record<string, StoredEffect>>({});
  const [loading, setLoading] = useState(true);
  const [captureIp, setCaptureIp] = useState("");
  const [captureName, setCaptureName] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState("");
  const [editIp, setEditIp] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [message, setMessage] = useState("");

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const loadEffects = async () => {
    try {
      const data = await getEffectLibrary();
      setEffects(data.effects);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEffects();
    if (devices.length > 0 && !captureIp) {
      setCaptureIp(devices[0].ip);
    }
  }, [devices]);

  const handleCapture = async () => {
    if (!captureName.trim() || !captureIp) return;
    setCapturing(true);
    try {
      const { effect } = await captureDeviceEffect(captureIp, captureName.trim());
      setEffects((prev) => ({ ...prev, [effect.name]: effect }));
      setCaptureName("");
      showMessage(`Saved effect "${effect.name}"`);
    } catch {
      showMessage("Failed to capture effect — is the device reachable?");
    } finally {
      setCapturing(false);
    }
  };

  const startEdit = (effect: StoredEffect) => {
    setEditingName(effect.name);
    setEditNameInput(effect.name);
    setEditIp("");
  };

  const handleEditSave = async () => {
    if (!editingName) return;
    const updates: { name?: string; ip?: string } = {};
    if (editNameInput.trim() && editNameInput.trim() !== editingName) updates.name = editNameInput.trim();
    if (editIp) updates.ip = editIp;
    if (!updates.name && !updates.ip) { setEditingName(null); return; }
    setEditSaving(true);
    try {
      const { effect } = await updateEffectInLibrary(editingName, updates);
      setEffects((prev) => {
        const next = { ...prev };
        if (updates.name && updates.name !== editingName) delete next[editingName];
        next[effect.name] = effect;
        return next;
      });
      setEditingName(null);
      showMessage(`Updated "${effect.name}"`);
    } catch {
      showMessage("Failed to update effect");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteEffectFromLibrary(name);
      setEffects((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } catch {
      showMessage("Failed to delete effect");
    }
  };

  const effectList = Object.values(effects);

  return (
    <div className="card" style={{ marginTop: "2rem" }}>
      <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.3rem", borderBottom: "2px solid #667eea", paddingBottom: "0.5rem" }}>
        ✨ Effect Library
      </h2>

      {loading ? (
        <p className="placeholder-text">Loading effects…</p>
      ) : effectList.length === 0 ? (
        <p className="placeholder-text" style={{ margin: "0.5rem 0 1rem" }}>
          No effects saved yet. Configure an effect in WLED, then capture it below.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {effectList.map((effect) => (
            <div key={effect.name}>
              {editingName === effect.name ? (
                <div style={{ background: "#1a1a1a", border: "1px solid #667eea", borderRadius: "8px", padding: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <input
                      autoFocus
                      value={editNameInput}
                      onChange={(e) => setEditNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); if (e.key === "Escape") setEditingName(null); }}
                      disabled={editSaving}
                      style={{
                        flex: 1,
                        minWidth: "8rem",
                        background: "#242424",
                        border: "1px solid #555",
                        borderRadius: "6px",
                        color: "#fff",
                        padding: "0.35rem 0.5rem",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    <select
                      value={editIp}
                      onChange={(e) => setEditIp(e.target.value)}
                      disabled={editSaving || devices.length === 0}
                      style={{
                        flex: 1,
                        background: "#242424",
                        border: "1px solid #444",
                        borderRadius: "6px",
                        color: editIp ? "#fff" : "#666",
                        padding: "0.35rem 0.5rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      <option value="">Re-capture from device (optional)</option>
                      {devices.map((d) => (
                        <option key={d.ip} value={d.ip}>{d.name} ({d.ip})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="logs-button" onClick={handleEditSave} disabled={editSaving}>
                      {editSaving ? "Saving…" : "Save"}
                    </button>
                    <button className="logs-button" onClick={() => setEditingName(null)} disabled={editSaving}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "0.15rem" }}>{effect.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#888", fontFamily: "monospace" }}>
                      {effect.capturedFromIp ?? "built-in"} · {new Date(effect.capturedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button
                      onClick={() => startEdit(effect)}
                      className="logs-button"
                      style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem" }}
                      title="Edit effect"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(effect.name)}
                      style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "1.1rem", padding: "0.2rem 0.4rem", lineHeight: 1 }}
                      title="Delete effect"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: "1px solid #333", paddingTop: "1rem" }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#aaa" }}>
          Set your WLED device to the desired effect using its web UI, then capture it here.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <select
            value={captureIp}
            onChange={(e) => setCaptureIp(e.target.value)}
            disabled={capturing || devices.length === 0}
            style={{
              background: "#242424",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "#fff",
              padding: "0.4rem 0.6rem",
              fontSize: "0.9rem",
              minWidth: "10rem",
            }}
          >
            {devices.length === 0 ? (
              <option value="">No devices found</option>
            ) : (
              devices.map((d) => (
                <option key={d.ip} value={d.ip}>{d.name} ({d.ip})</option>
              ))
            )}
          </select>
          <input
            type="text"
            placeholder="Effect name…"
            value={captureName}
            onChange={(e) => setCaptureName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCapture(); }}
            disabled={capturing}
            style={{
              flex: 1,
              minWidth: "8rem",
              background: "#242424",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "#fff",
              padding: "0.4rem 0.6rem",
              fontSize: "0.9rem",
            }}
          />
          <button
            className="logs-button"
            onClick={handleCapture}
            disabled={capturing || !captureName.trim() || !captureIp}
          >
            {capturing ? "Capturing…" : "📸 Capture"}
          </button>
        </div>
      </div>

      {message && (
        <div className="warning-message" style={{ marginTop: "0.75rem" }}>{message}</div>
      )}
    </div>
  );
}
