import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { DEFAULT_SOUL } from "@/lib/ai/prompts";
import { getUserSoul } from "@/lib/db/queries";
import { SoulEditor } from "./soul-editor";

async function AgentPanel() {
  const session = await auth();

  if (!session?.user || session.user.type === "guest") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-semibold text-2xl tracking-tight">Agent Identity</h1>
        <p className="mt-4 text-muted-foreground">
          Sign in as a regular user to manage your agent identity.
        </p>
      </div>
    );
  }

  const soul = await getUserSoul({ userId: session.user.id });

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Agent Identity</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Customize your agent's name, voice, and principles. This is separate from memory — soul describes who the agent is, not facts about you.
        </p>
      </div>

      <SoulEditor currentSoul={soul} defaultSoul={DEFAULT_SOUL} />
    </div>
  );
}

function AgentSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-8 px-6 py-12">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-48 rounded-lg bg-muted" />
      <div className="h-32 rounded-lg bg-muted" />
    </div>
  );
}

export default async function AgentPage() {
  await connection();
  return (
    <Suspense fallback={<AgentSkeleton />}>
      <AgentPanel />
    </Suspense>
  );
}
