import "server-only";
import postgres from "postgres";
import { env } from "@/lib/env";

// One small pool per server instance. `prepare: false` keeps it working through
// Supabase's connection pooler in transaction mode (port 6543).
const globalForDb = globalThis as unknown as { sbAdminSql?: postgres.Sql };

export function db() {
  globalForDb.sbAdminSql ??= postgres(env.databaseUrl(), {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
  return globalForDb.sbAdminSql;
}

/** True when a query failed because a unique column (code, slug) already has that value. */
export function uniqueViolation(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err && err.code === "23505") {
    const detail = "constraint_name" in err ? String(err.constraint_name) : "";
    return detail;
  }
  return null;
}
