"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface BotInfo {
  id: number;
  username: string;
  first_name: string;
}

interface WebhookInfo {
  url: string;
  pending_update_count: number;
  last_error_message?: string;
  last_error_date?: number;
  allowed_updates?: string[];
}

interface Props {
  initialBotInfo: BotInfo | null;
  initialBotError: string | null;
  initialWebhookInfo: WebhookInfo | null;
  initialWebhookError: string | null;
}

export function TelegramDebugPanel({
  initialBotInfo,
  initialBotError,
  initialWebhookInfo,
  initialWebhookError,
}: Props) {
  const [botInfo, setBotInfo] = useState(initialBotInfo);
  const [botError, setBotError] = useState(initialBotError);
  const [webhookInfo, setWebhookInfo] = useState(initialWebhookInfo);
  const [webhookError, setWebhookError] = useState(initialWebhookError);
  const [working, setWorking] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  async function refreshStatus() {
    setWorking(true);
    setActionMsg("");
    try {
      const res = await fetch("/api/telegram/debug/info");
      const data = await res.json();
      setBotInfo(data.botInfo ?? null);
      setBotError(data.botError ?? null);
      setWebhookInfo(data.webhookInfo ?? null);
      setWebhookError(data.webhookError ?? null);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setWorking(false);
    }
  }

  async function doAction(action: "register" | "delete") {
    setWorking(true);
    setActionMsg("");
    try {
      const res = await fetch(`/api/telegram/debug/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setActionMsg(data.message ?? "Done");
      await refreshStatus();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button disabled={working} onClick={refreshStatus} size="sm" variant="outline">
          {working ? "Working…" : "Refresh"}
        </Button>
        <Button disabled={working} onClick={() => doAction("register")} size="sm">
          Register webhook
        </Button>
        <Button
          disabled={working}
          onClick={() => doAction("delete")}
          size="sm"
          variant="destructive"
        >
          Delete webhook
        </Button>
        {actionMsg && <span className="text-sm text-muted-foreground">{actionMsg}</span>}
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="font-medium text-sm uppercase tracking-wide">Bot info</h2>
        {botError ? (
          <p className="mt-2 text-destructive text-sm">{botError}</p>
        ) : botInfo ? (
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Username</dt>
              <dd className="font-mono">@{botInfo.username}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{botInfo.first_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Bot ID</dt>
              <dd className="font-mono text-xs">{botInfo.id}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-muted-foreground text-sm">No bot info available.</p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="font-medium text-sm uppercase tracking-wide">Webhook info</h2>
        {webhookError ? (
          <p className="mt-2 text-destructive text-sm">{webhookError}</p>
        ) : webhookInfo ? (
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">URL</dt>
              <dd className="font-mono text-xs break-all">
                {webhookInfo.url || "(not set)"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Pending updates</dt>
              <dd
                className={
                  webhookInfo.pending_update_count > 0
                    ? "font-semibold text-amber-600"
                    : ""
                }
              >
                {webhookInfo.pending_update_count}
              </dd>
            </div>
            {webhookInfo.allowed_updates && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Allowed updates</dt>
                <dd className="font-mono text-xs">
                  {webhookInfo.allowed_updates.join(", ")}
                </dd>
              </div>
            )}
            {webhookInfo.last_error_message && (
              <div className="flex flex-col gap-1 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <span className="font-medium text-destructive text-xs">
                  Last delivery error
                </span>
                <span className="text-destructive text-xs">
                  {webhookInfo.last_error_message}
                </span>
                {webhookInfo.last_error_date && (
                  <span className="text-muted-foreground text-xs">
                    {new Date(webhookInfo.last_error_date * 1000).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-2 text-muted-foreground text-sm">No webhook info available.</p>
        )}
      </section>

      <section className="rounded-lg border bg-muted/30 p-4 text-muted-foreground text-xs space-y-1">
        <p>
          <strong>Note:</strong> Telegram does not support both getUpdates (long polling)
          and a webhook simultaneously.
        </p>
        <p>
          If you need to use getUpdates for local testing, click "Delete webhook" first.
        </p>
      </section>
    </div>
  );
}
