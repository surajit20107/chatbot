import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { getTelegramStatusByUserId } from "@/lib/db/queries";
import { TelegramLinkPanel } from "./link-panel";

async function TelegramPanel() {
  const session = await auth();

  if (!session?.user || session.user.type === "guest") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-semibold text-2xl tracking-tight">Telegram</h1>
        <p className="mt-4 text-muted-foreground">
          Sign in as a regular user to connect Telegram.
        </p>
        <Link className="mt-4 inline-block text-primary hover:underline underline-offset-4" href="/login">
          Go to login
        </Link>
      </div>
    );
  }

  const status = await getTelegramStatusByUserId({ userId: session.user.id });

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Telegram</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Connect your Telegram account to chat with your agent via direct message.
        </p>
      </div>

      <TelegramLinkPanel
        initialChatId={status?.telegramChatId ?? null}
        initialLinked={Boolean(status?.telegramChatId)}
      />

      <p className="text-muted-foreground text-xs">
        <Link className="underline-offset-4 hover:underline" href="/">
          Back to chat
        </Link>
      </p>
    </div>
  );
}

function TelegramSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-8 px-6 py-12">
      <div className="h-8 w-40 rounded bg-muted" />
      <div className="h-32 rounded-lg bg-muted" />
    </div>
  );
}

export default async function TelegramPage() {
  await connection();
  return (
    <Suspense fallback={<TelegramSkeleton />}>
      <TelegramPanel />
    </Suspense>
  );
}
