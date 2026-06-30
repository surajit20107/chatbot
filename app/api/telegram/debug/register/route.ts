import { setWebhook } from "@/lib/telegram";

export async function POST() {
  try {
    await setWebhook({ dropPendingUpdates: true });
    return Response.json({ message: "Webhook registered successfully" });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to register webhook" },
      { status: 500 }
    );
  }
}
