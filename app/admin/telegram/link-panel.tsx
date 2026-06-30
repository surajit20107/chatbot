"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface LinkInfo {
  token: string;
  botUsername: string;
  deepLink: string;
  expiresInMinutes: number;
}

interface TelegramLinkPanelProps {
  initialLinked: boolean;
  initialChatId: string | null;
}

export function TelegramLinkPanel({
  initialLinked,
  initialChatId,
}: TelegramLinkPanelProps) {
  const [linked, setLinked] = useState(initialLinked);
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  async function handleLink() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate link");
      const data: LinkInfo = await res.json();
      setLinkInfo(data);

      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch("/api/telegram/status");
          const status = await statusRes.json();
          if (status.linked) {
            setLinked(true);
            setChatId(status.telegramChatId);
            setLinkInfo(null);
            stopPolling();
          }
        } catch {
          /* ignore poll errors */
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    setUnlinking(true);
    setError("");
    try {
      const res = await fetch("/api/telegram/unlink", { method: "POST" });
      if (!res.ok) throw new Error("Failed to unlink");
      setLinked(false);
      setChatId(null);
      setLinkInfo(null);
      stopPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUnlinking(false);
    }
  }

  if (linked) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-green-500" />
          <h2 className="font-medium text-sm">Telegram connected</h2>
        </div>
        {chatId && (
          <p className="mt-2 font-mono text-muted-foreground text-xs">
            Chat ID: {chatId}
          </p>
        )}
        <p className="mt-2 text-muted-foreground text-sm">
          DM your bot on Telegram to chat with your agent.
        </p>
        {error && <p className="mt-2 text-destructive text-xs">{error}</p>}
        <Button
          className="mt-4"
          disabled={unlinking}
          onClick={handleUnlink}
          size="sm"
          variant="outline"
        >
          {unlinking ? "Unlinking…" : "Unlink Telegram"}
        </Button>
      </section>
    );
  }

  if (linkInfo) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm space-y-4">
        <h2 className="font-medium text-sm">Link your Telegram</h2>
        <p className="text-muted-foreground text-sm">
          Open the link below or send this command to{" "}
          <span className="font-mono">@{linkInfo.botUsername}</span> in Telegram:
        </p>
        <div className="rounded-md bg-muted px-3 py-2 font-mono text-sm select-all">
          /start {linkInfo.token}
        </div>
        <div className="flex gap-3">
          <a
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            href={linkInfo.deepLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open in Telegram
          </a>
          <Button
            onClick={() => {
              setLinkInfo(null);
              stopPolling();
            }}
            size="sm"
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Waiting for you to send the command… (expires in {linkInfo.expiresInMinutes}{" "}
          minutes)
        </p>
        {error && <p className="text-destructive text-xs">{error}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="font-medium text-sm">Connect Telegram</h2>
      <p className="mt-2 text-muted-foreground text-sm">
        Link your Telegram account to chat with your agent via DM.
      </p>
      {error && <p className="mt-2 text-destructive text-xs">{error}</p>}
      <Button
        className="mt-4"
        disabled={loading}
        onClick={handleLink}
        size="sm"
      >
        {loading ? "Generating link…" : "Link Telegram"}
      </Button>
    </section>
  );
}
