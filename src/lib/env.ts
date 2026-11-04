import "server-only";

/** Reads a required setting, with a message that says what to do when it is missing. */
function required(name: string, hint: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set. ${hint}`);
  return value;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL", "Add the Supabase connection string to .env.local (see README)."),
  adminPassword: () => {
    const value = required("ADMIN_PASSWORD", "Choose a secret key for signing in and add it to .env.local.");
    if (value.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
    return value;
  },
  storeUrl: () => process.env.STORE_URL?.trim().replace(/\/$/, "") || "",
  revalidateSecret: () => process.env.REVALIDATE_SECRET?.trim() || "",
  supabaseUrl: () => process.env.SUPABASE_URL?.trim().replace(/\/$/, "") || "",
  supabaseServiceKey: () => process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "",
  /** Where this admin app is reachable, used only for locally stored dev photos. */
  publicUrl: () => process.env.ADMIN_PUBLIC_URL?.trim().replace(/\/$/, "") || "http://localhost:3001",
};
