const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

async function callTelegramApi<T = unknown>(
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${TELEGRAM_API}${getBotToken()}/${method}`;
  const res = await fetch(url, {
    method: body !== undefined ? "POST" : "GET",
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(
      `Telegram ${method} failed: ${data.description ?? "unknown error"}`
    );
  }
  return data.result as T;
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string
): Promise<void> {
  const truncated = text.length > 4096 ? `${text.slice(0, 4090)}…` : text;
  await callTelegramApi("sendMessage", {
    chat_id: chatId,
    text: truncated,
  });
}

export async function getBotInfo(): Promise<{
  id: number;
  username: string;
  first_name: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}> {
  return callTelegramApi("getMe");
}

export async function getWebhookInfo(): Promise<{
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}> {
  return callTelegramApi("getWebhookInfo");
}

export async function setWebhook({
  dropPendingUpdates = false,
}: { dropPendingUpdates?: boolean } = {}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set");
  if (!secret) throw new Error("TELEGRAM_WEBHOOK_SECRET is not set");
  return callTelegramApi("setWebhook", {
    url: `${appUrl}/api/telegram-webhook`,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: dropPendingUpdates,
  });
}

export async function deleteWebhook({
  dropPendingUpdates = false,
}: { dropPendingUpdates?: boolean } = {}): Promise<boolean> {
  return callTelegramApi("deleteWebhook", {
    drop_pending_updates: dropPendingUpdates,
  });
}
