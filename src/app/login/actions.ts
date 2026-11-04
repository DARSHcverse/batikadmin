"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, passwordMatches, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export async function signIn(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    return { error: "The secret key hasn't been set up yet. Add ADMIN_PASSWORD (12+ characters) to the settings." };
  }
  const input = String(form.get("password") ?? "");
  if (!passwordMatches(input, password)) {
    // Slows down guessing. Use a long secret key: this is the main protection.
    await new Promise((r) => setTimeout(r, 900));
    return { error: "That secret key isn't right." };
  }
  (await cookies()).set(SESSION_COOKIE, createSessionToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  const next = String(form.get("next") ?? "/");
  // Only ever return to a page inside this app.
  redirect(/^\/(?!\/)[\w\-/]*$/.test(next) ? next : "/");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
