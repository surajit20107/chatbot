import { connection } from "next/server";
import { Suspense } from "react";
import { AdminPanel } from "./admin-panel";


function AdminSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-8 px-6 py-12">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-32 rounded-lg bg-muted" />
      <div className="h-48 rounded-lg bg-muted" />
    </div>
  );
}

export default async function AdminPage() {
  await connection();

  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminPanel />
    </Suspense>
  );
}
