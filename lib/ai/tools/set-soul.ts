import { tool } from "ai";
import { z } from "zod";
import { updateUserSoul } from "@/lib/db/queries";

export function setSoulTool(userId: string) {
  return tool({
    description:
      "Persist the agent's identity and communication style for this user. Call this at the end of onboarding after learning the user's preferences for the agent name and communication style. Soul describes who the agent is — not facts about the user.",
    inputSchema: z.object({
      soul: z
        .string()
        .min(20)
        .max(4000)
        .describe(
          "A description of the agent's identity, name, and communication style. Example: \"Your name is Nova. You communicate in a concise, direct style.\""
        ),
    }),
    execute: async ({ soul }) => {
      await updateUserSoul({ userId, soul });
      return { success: true };
    },
  });
}
