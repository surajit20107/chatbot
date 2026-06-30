import { deleteWebhook } from "@/lib/telegram";

export async function POST() {
  try {
    await deleteWebhook({ dropPendingUpdates: true });
    return Response.json({ message: "Webhook deleted successfully" });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
