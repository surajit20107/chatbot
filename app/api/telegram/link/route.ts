import { randomBytes } from "node:crypto";
import { auth } from "@/app/(auth)/auth";
import { setTelegramLinkToken } from "@/lib/db/queries";

export async function POST() {
  const session = await auth();

  if (!session?.user || session.user.type === "guest") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = randomBytes(4).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await setTelegramLinkToken({ userId: session.user.id, token, expiresAt });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "";
  const deepLink = `https://t.me/${botUsername}?start=${token}`;

  return Response.json({
    token,
    botUsername,
    deepLink,
    expiresInMinutes: 10,
  });
}
