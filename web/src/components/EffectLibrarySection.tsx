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
    <div className="card effect-library">
      <h2>✨ Effect Library</h2>

      {loading ? (
        <p className="placeholder-text">Loading effects…</p>
      ) : effectList.length === 0 ? (
        <p className="placeholder-text effect-placeholder">
          No effects saved yet. Configure an effect in WLED, then capture it below.
        </p>
      ) : (
        <div className="effect-list">
          {effectList.map((effect) => (
            <div key={effect.name}>
              {editingName === effect.name ? (
                <div className="effect-edit-form">
                  <div className="effect-form-row">
                    <input
                      autoFocus
                      value={editNameInput}
                      onChange={(e) => setEditNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); if (e.key === "Escape") setEditingName(null); }}
                      disabled={editSaving}
                      className="effect-form-input"
                    />
                  </div>
                  <div className="effect-form-row">
                    <select
                      value={editIp}
                      onChange={(e) => setEditIp(e.target.value)}
                      disabled={editSaving || devices.length === 0}
                      className={`effect-form-select${editIp ? "" : " effect-form-select--empty"}`}
                    >
                      <option value="">Re-capture from device (optional)</option>
                      {devices.map((d) => (
                        <option key={d.ip} value={d.ip}>{d.name} ({d.ip})</option>
                      ))}
                    </select>
                  </div>
                  <div className="effect-form-actions">
                    <button className="logs-button" onClick={handleEditSave} disabled={editSaving}>
                      {editSaving ? "Saving…" : "Save"}
                    </button>
                    <button className="logs-button" onClick={() => setEditingName(null)} disabled={editSaving}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="effect-item">
                  <div>
                    <div className="effect-item-name">{effect.name}</div>
                    <div className="effect-item-meta">
                      {effect.capturedFromIp ?? "built-in"} · {new Date(effect.capturedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="effect-item-actions">
                    <button
                      onClick={() => startEdit(effect)}
                      className="logs-button btn-icon"
                      title="Edit effect"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(effect.name)}
                      className="btn-ghost"
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

      <div className="effect-capture-section">
        <p className="effect-capture-hint">
          Set your WLED device to the desired effect using its web UI, then capture it here.
        </p>
        <div className="effect-capture-row">
          <select
            value={captureIp}
            onChange={(e) => setCaptureIp(e.target.value)}
            disabled={capturing || devices.length === 0}
            className="effect-capture-select"
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
            className="effect-capture-input"
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

      {message && <div className="warning-message">{message}</div>}
    </div>
  );
}
