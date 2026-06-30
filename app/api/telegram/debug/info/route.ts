import { getBotInfo, getWebhookInfo } from "@/lib/telegram";

export async function GET() {
  let botInfo = null;
  let botError = null;
  let webhookInfo = null;
  let webhookError = null;

  try {
    botInfo = await getBotInfo();
  } catch (err) {
    botError = err instanceof Error ? err.message : "Failed to fetch bot info";
  }

  try {
    webhookInfo = await getWebhookInfo();
  } catch (err) {
    webhookError = err instanceof Error ? err.message : "Failed to fetch webhook info";
  }

  return Response.json({ botInfo, botError, webhookInfo, webhookError });
}
