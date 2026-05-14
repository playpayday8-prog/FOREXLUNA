import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users, userSettings } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword, generateSalt, createToken } from "../../db/auth.js";

export default async (req: Request) => {
  const url = new URL(req.url);
  const action = url.pathname.replace("/api/auth/", "");

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json();

  if (action === "register") {
    const { username, password } = body;

    if (!username || !password) {
      return Response.json({ error: "Username and password are required." }, { status: 400 });
    }

    if (username.length < 3) {
      return Response.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return Response.json(
        { error: "Username can only contain letters, numbers, and underscores." },
        { status: 400 },
      );
    }

    const existing = await db.select().from(users).where(eq(users.username, username.toLowerCase()));

    if (existing.length > 0) {
      return Response.json({ error: "Username already taken. Please choose another." }, { status: 409 });
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    const [newUser] = await db
      .insert(users)
      .values({
        username: username.toLowerCase(),
        passwordHash,
        salt,
      })
      .returning();

    await db.insert(userSettings).values({
      userId: String(newUser.id),
      savedAccounts: [],
      propSettings: {},
      tradeHistory: [],
      metaToken: "",
      preferences: {},
    });

    return Response.json({ success: true, message: "Account created successfully!" });
  }

  if (action === "login") {
    const { username, password } = body;

    if (!username || !password) {
      return Response.json({ error: "Username and password are required." }, { status: 400 });
    }

    const rows = await db.select().from(users).where(eq(users.username, username.toLowerCase()));

    if (rows.length === 0) {
      return Response.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const user = rows[0];
    const passwordHash = await hashPassword(password, user.salt);

    if (passwordHash !== user.passwordHash) {
      return Response.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const token = await createToken(user.id, user.username);

    return Response.json({
      success: true,
      token,
      user: { id: user.id, username: user.username },
    });
  }

  return Response.json({ error: "Unknown action." }, { status: 404 });
};

export const config: Config = {
  path: "/api/auth/*",
};
