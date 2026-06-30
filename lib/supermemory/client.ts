import "server-only";
import { supermemoryTools } from "@supermemory/tools/ai-sdk";
import type { ToolSet } from "ai";

export function getSupermemoryToolsForUser(userId: string): ToolSet {
  const apiKey = process.env.SUPERMEMORY_API_KEY;
  if (!apiKey) return {};

  try {
    return supermemoryTools(apiKey, { containerTags: [userId] }) as unknown as ToolSet;
  } catch (error) {
    console.error("[Supermemory] Failed to load tools for user:", userId, error);
    return {};
  }
}
