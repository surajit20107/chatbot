import "server-only";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import type { ToolSet } from "ai";

type ComposioVercelClient = Composio<VercelProvider>;

let composioClient: ComposioVercelClient | null = null;

export function getComposioClient(): ComposioVercelClient | null {
  if (!process.env.COMPOSIO_API_KEY) {
    return null;
  }

  if (!composioClient) {
    composioClient = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new VercelProvider(),
    });
  }

  return composioClient;
}

export async function getComposioToolsForUser(userId: string): Promise<ToolSet> {
  const composio = getComposioClient();
  if (!composio) {
    return {};
  }

  try {
    const session = await composio.create(userId);
    return await session.tools();
  } catch (error) {
    console.error("[Composio] Failed to load tools for user:", userId, error);
    return {};
  }
}
