"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SoulEditorProps {
  currentSoul: string | null;
  defaultSoul: string;
}

export function SoulEditor({ currentSoul, defaultSoul }: SoulEditorProps) {
  const [value, setValue] = useState(currentSoul ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSave() {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/agent/soul", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soul: value.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save");
      setStatus("error");
    }
  }

  async function handleReset() {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/agent/soul", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soul: null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to reset");
      }
      setValue("");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to reset");
      setStatus("error");
    }
  }

  const isBusy = status === "saving";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="font-medium text-sm uppercase tracking-wide">Current soul</h2>
        <p className="mt-1 mb-3 text-muted-foreground text-xs">
          Leave blank to use the default soul below.
        </p>
        <Textarea
          className="min-h-48 font-mono text-sm"
          disabled={isBusy}
          onChange={(e) => {
            setValue(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="Describe your agent's identity, name, and communication style…"
          value={value}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button disabled={isBusy} onClick={handleSave} size="sm">
            {isBusy ? "Saving…" : status === "saved" ? "Saved!" : "Save"}
          </Button>
          <Button
            disabled={isBusy}
            onClick={handleReset}
            size="sm"
            variant="outline"
          >
            Reset to default
          </Button>
          {status === "error" && (
            <span className="text-destructive text-xs">{errorMsg}</span>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-muted/30 p-5">
        <h2 className="font-medium text-sm uppercase tracking-wide">Default soul</h2>
        <p className="mt-1 mb-3 text-muted-foreground text-xs">
          Applied when no custom soul is set.
        </p>
        <pre className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
          {defaultSoul}
        </pre>
      </section>
    </div>
  );
}
