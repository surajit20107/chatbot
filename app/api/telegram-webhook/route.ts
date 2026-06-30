import { timingSafeEqual } from "node:crypto";
import { generateText, stepCountIs } from "ai";
import { after } from "next/server";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildSoulPrompt, regularPrompt } from "@/lib/ai/prompts";
import { getComposioToolsForUser } from "@/lib/composio/client";
import {
  getRecentTelegramTurns,
  getUserByTelegramChatId,
  getUserByTelegramLinkToken,
  getUserSoul,
  linkTelegramChatId,
  saveTelegramTurns,
} from "@/lib/db/queries";
import { getSupermemoryToolsForUser } from "@/lib/supermemory/client";
import { sendTelegramMessage } from "@/lib/telegram";

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name: string; username?: string };
    chat: {
      id: number;
      type: "private" | "group" | "supergroup" | "channel";
    };
    text?: string;
  };
};

const TELEGRAM_BREVITY =
  "You are responding via Telegram DM. Keep replies concise and conversational. Use plain text only — no markdown symbols like **, __, or backtick code blocks.";

async function handleStart(chatId: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (!token) {
    await sendTelegramMessage(
      chatId,
      `To link your account, visit ${appUrl}/admin/telegram and click "Link Telegram".`
    );
    return;
  }

  const userRow = await getUserByTelegramLinkToken({ token });
  if (!userRow) {
    await sendTelegramMessage(
      chatId,
      "That link code is invalid or has expired. Please generate a new one from /admin/telegram."
    );
    return;
  }

  await linkTelegramChatId({ userId: userRow.id, telegramChatId: chatId });
  await sendTelegramMessage(
    chatId,
    "Linked! Your Telegram is now connected to your account. Send me a message to get started."
  );
}

async function handleMessage(chatId: string, text: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const userRow = await getUserByTelegramChatId({ telegramChatId: chatId });

  if (!userRow) {
    await sendTelegramMessage(
      chatId,
      `Your Telegram is not linked to an account yet. Visit ${appUrl}/admin/telegram to connect.`
    );
    return;
  }

  const [composioTools, memoryTools, recentTurns, userSoul] = await Promise.all(
    [
      getComposioToolsForUser(userRow.id),
      process.env.SUPERMEMORY_API_KEY
        ? Promise.resolve(getSupermemoryToolsForUser(userRow.id))
        : Promise.resolve({}),
      getRecentTelegramTurns({ telegramChatId: chatId, limit: 10 }),
      getUserSoul({ userId: userRow.id }),
    ]
  );

  const historyMessages = recentTurns.map((t) => ({
    role: t.role as "user" | "assistant",
    content: t.content,
  }));

  const system = [buildSoulPrompt(userSoul), regularPrompt, TELEGRAM_BREVITY].join(
    "\n\n"
  );

  const result = await generateText({
    model: getLanguageModel(DEFAULT_CHAT_MODEL),
    system,
    messages: [...historyMessages, { role: "user", content: text }],
    tools: { ...composioTools, ...memoryTools },
    stopWhen: stepCountIs(8),
  });

  const assistantText = result.text.trim() || "I couldn't generate a response.";

  await saveTelegramTurns({
    turns: [
      { telegramChatId: chatId, role: "user", content: text },
      { telegramChatId: chatId, role: "assistant", content: assistantText },
    ],
  });

  await sendTelegramMessage(chatId, assistantText);
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
  }

  const headerSecret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  const expectedBuf = Buffer.from(secret, "utf8");
  const providedBuf = Buffer.from(headerSecret, "utf8");

  const isValid =
    expectedBuf.length === providedBuf.length &&
    timingSafeEqual(expectedBuf, providedBuf);

  if (!isValid) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return Response.json({ ok: true });
  }

  const msg = update.message;
  if (!msg || msg.chat.type !== "private") {
    return Response.json({ ok: true });
  }

  const chatId = String(msg.chat.id);
  const text = (msg.text ?? "").trim();

  const startMatch = text.match(/^\/start(?:@\S+)?(?:\s+(.+))?$/);
  if (startMatch) {
    const token = (startMatch[1] ?? "").trim();
    after(async () => {
      try {
        await handleStart(chatId, token);
      } catch (err) {
        console.error("[Telegram] handleStart error:", err);
      }
    });
    return Response.json({ ok: true });
  }

  if (!text) {
    return Response.json({ ok: true });
  }

  after(async () => {
    try {
      await handleMessage(chatId, text);
    } catch (err) {
      console.error("[Telegram] handleMessage error:", err);
    }
  });

  return Response.json({ ok: true });
}
