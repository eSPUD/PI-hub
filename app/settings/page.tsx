"use client";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { exportJSON, exportZip, importBackup, wipeAllData } from "@/lib/backup";

export default function SettingsPage() {
  const { store, refresh, loaded } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  if (!loaded) return <p className="muted">Loading…</p>;

  const counts = {
    projects: store.projects.length,
    members: store.members.length,
    cfps: store.cfps.length,
  };

  const handleImport = async (file: File) => {
    setBusy("Importing…");
    setStatus(null);
    try {
      await importBackup(file);
      await refresh();
      setStatus(`Imported ${file.name}.`);
    } catch (e) {
      setStatus(`Import failed: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="stack">
      <section>
        <h1>Settings</h1>
        <p className="muted small" style={{ margin: 0 }}>
          All PI-hub data lives in this browser on this device. Use backup &amp; restore to move it between devices.
        </p>
      </section>

      <section className="card">
        <h2>Local data</h2>
        <ul className="list" style={{ marginTop: 8 }}>
          <li>{counts.projects} project{counts.projects === 1 ? "" : "s"}</li>
          <li>{counts.members} member{counts.members === 1 ? "" : "s"}</li>
          <li>{counts.cfps} call{counts.cfps === 1 ? "" : "s"} for papers</li>
        </ul>
        <p className="muted small" style={{ marginTop: 10 }}>
          Storage is IndexedDB scoped to this origin and this browser profile.
        </p>
      </section>

      <section className="card">
        <h2>Backup</h2>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Download a complete snapshot of your data. JSON is the canonical format. The ZIP also includes
          per-entity markdown files for human-readable archival.
        </p>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            disabled={!!busy}
            onClick={async () => {
              setBusy("Building JSON…");
              try {
                await exportJSON();
                setStatus("Downloaded JSON backup.");
              } finally {
                setBusy(null);
              }
            }}
          >
            Download JSON
          </button>
          <button
            className="btn"
            disabled={!!busy}
            onClick={async () => {
              setBusy("Building ZIP…");
              try {
                await exportZip();
                setStatus("Downloaded ZIP backup (JSON + markdown).");
              } finally {
                setBusy(null);
              }
            }}
          >
            Download ZIP (JSON + markdown)
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Restore</h2>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Pick a previous JSON or ZIP backup. Importing merges into existing data — items with the same
          id are overwritten. Use Wipe before importing if you want a clean restore.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.zip,application/json,application/zip"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = "";
          }}
        />
        <button className="btn" disabled={!!busy} onClick={() => fileRef.current?.click()}>
          Choose backup file…
        </button>
      </section>

      <section className="card">
        <h2>Wipe all data</h2>
        <p className="muted small" style={{ marginBottom: 12 }}>
          Permanently deletes the PI profile, every project, every member, every CFP, and their
          relationships from this device. Cannot be undone — back up first if you want to keep anything.
        </p>
        <button
          className="btn btn-danger"
          disabled={!!busy}
          onClick={async () => {
            if (!confirm("This deletes ALL data on this device. Continue?")) return;
            if (!confirm("Are you sure? This cannot be undone.")) return;
            setBusy("Wiping…");
            try {
              await wipeAllData();
              await refresh();
              setStatus("All data wiped.");
            } finally {
              setBusy(null);
            }
          }}
        >
          Wipe everything
        </button>
      </section>

      {(busy || status) && (
        <section>
          {busy && <p className="muted small">{busy}</p>}
          {status && <p className="small">{status}</p>}
        </section>
      )}
    </div>
  );
}
