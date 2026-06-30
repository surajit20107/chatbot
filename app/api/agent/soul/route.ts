import { auth } from "@/app/(auth)/auth";
import { getUserSoul, updateUserSoul } from "@/lib/db/queries";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.type === "guest") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const soul = await getUserSoul({ userId: session.user.id });
  return Response.json({ soul });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.type === "guest") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { soul?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const soul = body.soul === undefined ? null : body.soul || null;

  await updateUserSoul({ userId: session.user.id, soul });
  return Response.json({ success: true, soul });
}
