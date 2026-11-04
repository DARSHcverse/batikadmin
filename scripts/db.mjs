// Runs the SQL files in db/ against DATABASE_URL.
//   npm run db:migrate   apply new migrations (tracked in the _migrations table)
//   npm run db:seed      add the 12 sample products (skips any whose code already exists)
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local (see README).");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
const command = process.argv[2];

try {
  if (command === "migrate") {
    await sql`create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`;
    const done = new Set((await sql`select name from _migrations`).map((r) => r.name));
    const files = (await readdir(path.join(root, "migrations"))).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      if (done.has(file)) continue;
      const text = await readFile(path.join(root, "migrations", file), "utf8");
      await sql.begin(async (tx) => {
        await tx.unsafe(text);
        await tx`insert into _migrations (name) values (${file})`;
      });
      console.log(`applied ${file}`);
    }
    console.log("Database is up to date.");
  } else if (command === "seed") {
    await sql.unsafe(await readFile(path.join(root, "seed.sql"), "utf8"));
    console.log("Sample products added (existing codes were left alone).");
  } else {
    console.error("Usage: node scripts/db.mjs migrate|seed");
    process.exit(1);
  }
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
