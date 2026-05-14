import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { userSettings } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyToken } from "../../db/auth.js";

export default async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = String(session.userId);

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (rows.length === 0) {
      return Response.json({
        savedAccounts: [],
        propSettings: {},
        tradeHistory: [],
        metaToken: "",
        preferences: {},
      });
    }

    const row = rows[0];
    return Response.json({
      savedAccounts: row.savedAccounts || [],
      propSettings: row.propSettings || {},
      tradeHistory: row.tradeHistory || [],
      metaToken: row.metaToken || "",
      preferences: row.preferences || {},
    });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const {
      savedAccounts: sa,
      propSettings: ps,
      tradeHistory: th,
      metaToken: mt,
      preferences: pf,
    } = body;

    const existing = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (existing.length === 0) {
      await db.insert(userSettings).values({
        userId,
        savedAccounts: sa ?? [],
        propSettings: ps ?? {},
        tradeHistory: th ?? [],
        metaToken: mt ?? "",
        preferences: pf ?? {},
      });
    } else {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (sa !== undefined) updates.savedAccounts = sa;
      if (ps !== undefined) updates.propSettings = ps;
      if (th !== undefined) updates.tradeHistory = th;
      if (mt !== undefined) updates.metaToken = mt;
      if (pf !== undefined) updates.preferences = pf;

      await db
        .update(userSettings)
        .set(updates)
        .where(eq(userSettings.userId, userId));
    }

    return Response.json({ success: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/user-data",
};
