import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { getBotInfo, getWebhookInfo } from "@/lib/telegram";
import { TelegramDebugPanel } from "./debug-panel";

async function DebugContent() {
  let botInfo: Awaited<ReturnType<typeof getBotInfo>> | null = null;
  let botError: string | null = null;
  let webhookInfo: Awaited<ReturnType<typeof getWebhookInfo>> | null = null;
  let webhookError: string | null = null;

  try {
    botInfo = await getBotInfo();
  } catch (err) {
    botError = err instanceof Error ? err.message : "Failed to fetch bot info";
  }

  try {
    webhookInfo = await getWebhookInfo();
  } catch (err) {
    webhookError =
      err instanceof Error ? err.message : "Failed to fetch webhook info";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Telegram debug</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Bot status, webhook registration, and delivery diagnostics.
        </p>
      </div>

      <TelegramDebugPanel
        initialBotError={botError}
        initialBotInfo={botInfo}
        initialWebhookError={webhookError}
        initialWebhookInfo={webhookInfo}
      />

      <p className="text-muted-foreground text-xs">
        <Link className="underline-offset-4 hover:underline" href="/">
          Back to chat
        </Link>
        {" · "}
        <Link className="underline-offset-4 hover:underline" href="/admin/telegram">
          Telegram linking
        </Link>
      </p>
    </div>
  );
}

function DebugSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-8 px-6 py-12">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-40 rounded-lg bg-muted" />
      <div className="h-40 rounded-lg bg-muted" />
    </div>
  );
}

export default async function TelegramDebugPage() {
  await connection();
  return (
    <Suspense fallback={<DebugSkeleton />}>
      <DebugContent />
    </Suspense>
  );
}
