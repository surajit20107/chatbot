import { auth } from "@/app/(auth)/auth";
import { getTelegramStatusByUserId } from "@/lib/db/queries";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.type === "guest") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getTelegramStatusByUserId({ userId: session.user.id });

  return Response.json({
    linked: Boolean(status?.telegramChatId),
    telegramChatId: status?.telegramChatId ?? null,
  });
}
