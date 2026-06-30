import { auth } from "@/app/(auth)/auth";
import { unlinkTelegramUser } from "@/lib/db/queries";

export async function POST() {
  const session = await auth();

  if (!session?.user || session.user.type === "guest") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await unlinkTelegramUser({ userId: session.user.id });
  return Response.json({ success: true });
}
