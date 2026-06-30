import Link from "next/link";
import { auth } from "@/app/(auth)/auth";
import { Badge } from "@/components/ui/badge";
import { getComposioClient } from "@/lib/composio/client";

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  const normalized = status.toUpperCase();
  if (normalized === "ACTIVE") {
    return "default";
  }
  if (
    normalized === "INITIATED" ||
    normalized === "INITIALIZING" ||
    normalized === "INITIATING"
  ) {
    return "secondary";
  }
  if (
    normalized === "FAILED" ||
    normalized === "EXPIRED" ||
    normalized === "REVOKED"
  ) {
    return "destructive";
  }
  return "outline";
}

export async function AdminPanel() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-semibold text-2xl tracking-tight">Composio Admin</h1>
        <p className="mt-4 text-muted-foreground">
          Sign in to view your Composio connection status.
        </p>
        <Link
          className="mt-4 inline-block text-primary underline-offset-4 hover:underline"
          href="/login"
        >
          Go to login
        </Link>
      </div>
    );
  }

  const { id, type, email } = session.user;
  const isGuest = type === "guest";
  const composio = getComposioClient();
  const missingApiKey = !composio;

  let fetchError: string | null = null;
  let connectedAccounts: Array<{
    id: string;
    status: string;
    toolkitSlug: string;
    toolkitName: string;
  }> = [];
  let activeToolkits: Array<{
    slug: string;
    name: string;
    status?: string;
  }> = [];
  let availableToolkits: Array<{ slug: string; name: string }> = [];

  if (composio && !isGuest) {
    try {
      const [accountsResponse, toolkitsList, composioSession] =
        await Promise.all([
          composio.connectedAccounts.list({ userIds: [id] }),
          composio.toolkits.get({ limit: 100 }),
          composio.create(id),
        ]);

      availableToolkits = toolkitsList.map((toolkit) => ({
        slug: toolkit.slug,
        name: toolkit.name,
      }));

      const toolkitNameBySlug = new Map(
        availableToolkits.map((toolkit) => [toolkit.slug, toolkit.name]),
      );

      connectedAccounts = (accountsResponse.items ?? []).map((account) => ({
        id: account.id,
        status: account.status,
        toolkitSlug: account.toolkit.slug,
        toolkitName:
          toolkitNameBySlug.get(account.toolkit.slug) ?? account.toolkit.slug,
      }));

      const sessionToolkits = await composioSession.toolkits();
      activeToolkits = (sessionToolkits.items ?? [])
        .filter(
          (item: {
            slug: string;
            name: string;
            connection?: {
              isActive?: boolean;
              connectedAccount?: { status?: string };
            };
          }) =>
            item.connection?.isActive ||
            item.connection?.connectedAccount?.status === "ACTIVE",
        )
        .map(
          (item: {
            slug: string;
            name: string;
            connection?: { connectedAccount?: { status?: string } };
          }) => ({
            slug: item.slug,
            name: item.name,
            status: item.connection?.connectedAccount?.status,
          }),
        );
    } catch (error) {
      console.error("[Composio] Admin panel data fetch failed:", error);
      fetchError =
        error instanceof Error
          ? error.message
          : "Failed to load Composio data";
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Composio Admin</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Per-user connection status and toolkit overview.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="font-medium text-sm uppercase tracking-wide">User</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">User ID</dt>
            <dd className="font-mono text-xs">{id}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Type</dt>
            <dd>
              <Badge variant={isGuest ? "secondary" : "default"}>{type}</Badge>
            </dd>
          </div>
          {email && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{email}</dd>
            </div>
          )}
        </dl>
      </section>

      {missingApiKey && (
        <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="font-medium text-destructive text-sm">
            Missing configuration
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            <code className="rounded bg-muted px-1 py-0.5">COMPOSIO_API_KEY</code>{" "}
            is not set. Composio tools and connection data are unavailable.
          </p>
        </section>
      )}

      {isGuest && (
        <section className="rounded-lg border bg-muted/30 p-5">
          <h2 className="font-medium text-sm">Guest account</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Guest users do not receive Composio tools. Local chat tools remain
            available in the main app.
          </p>
        </section>
      )}

      {fetchError && (
        <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="font-medium text-destructive text-sm">Fetch error</h2>
          <p className="mt-2 text-muted-foreground text-sm">{fetchError}</p>
        </section>
      )}

      {!isGuest && !missingApiKey && (
        <>
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="font-medium text-sm uppercase tracking-wide">
              Connected accounts
            </h2>
            {connectedAccounts.length === 0 ? (
              <p className="mt-3 text-muted-foreground text-sm">
                No connected accounts yet. Ask the assistant to connect a service
                (e.g. Gmail) in chat.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {connectedAccounts.map((account) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm"
                    key={account.id}
                  >
                    <span>
                      <span className="font-medium">{account.toolkitName}</span>
                      <span className="ml-2 font-mono text-muted-foreground text-xs">
                        {account.toolkitSlug}
                      </span>
                    </span>
                    <Badge variant={getStatusBadgeVariant(account.status)}>
                      {account.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="font-medium text-sm uppercase tracking-wide">
              Active toolkits
            </h2>
            {activeToolkits.length === 0 ? (
              <p className="mt-3 text-muted-foreground text-sm">
                No active toolkit connections in the current session.
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {activeToolkits.map((toolkit) => (
                  <li key={toolkit.slug}>
                    <Badge className="gap-1.5" variant="default">
                      {toolkit.name}
                      {toolkit.status && (
                        <span className="text-primary-foreground/70 text-xs">
                          ({toolkit.status})
                        </span>
                      )}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="font-medium text-sm uppercase tracking-wide">
              Available toolkits
            </h2>
            <p className="mt-1 text-muted-foreground text-xs">
              {availableToolkits.length} toolkits available via Composio
            </p>
            {availableToolkits.length === 0 ? (
              <p className="mt-3 text-muted-foreground text-sm">
                No toolkits returned from the API.
              </p>
            ) : (
              <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
                {availableToolkits.map((toolkit) => (
                  <li
                    className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted/40"
                    key={toolkit.slug}
                  >
                    <span>{toolkit.name}</span>
                    <span className="font-mono text-muted-foreground text-xs">
                      {toolkit.slug}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p className="text-muted-foreground text-xs">
        <Link className="underline-offset-4 hover:underline" href="/">
          Back to chat
        </Link>
      </p>
    </div>
  );
}
