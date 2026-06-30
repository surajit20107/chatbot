import type { ChatMessage } from "@/lib/types";

const TOOL_CALL_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function sanitizeToolCallIds(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      if (!("toolCallId" in part) || typeof part.toolCallId !== "string") {
        return part;
      }

      if (TOOL_CALL_ID_PATTERN.test(part.toolCallId)) {
        return part;
      }

      const sanitized = part.toolCallId.replace(/[^a-zA-Z0-9_-]/g, "_");
      return { ...part, toolCallId: sanitized };
    }),
  }));
}
