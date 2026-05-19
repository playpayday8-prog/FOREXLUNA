import type { Config } from "@netlify/functions";
import MetaApi from "metaapi.cloud-sdk/node";

const CONNECT_TIMEOUT_SEC = 60;
const SYNC_TIMEOUT_SEC = 60;

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { accountId, positionId } = body;

    if (!accountId || !positionId) {
      return Response.json(
        { error: "Missing required fields: accountId, positionId" },
        { status: 400 }
      );
    }

    const token = Netlify.env.get("METAAPI_MASTER_TOKEN");
    if (!token) {
      return Response.json(
        { error: "MetaAPI is not configured. Set METAAPI_MASTER_TOKEN in Netlify environment variables." },
        { status: 503 }
      );
    }

    const api = new MetaApi(token);
    const account = await api.metatraderAccountApi.getAccount(accountId);

    if (account.state !== "DEPLOYED") {
      await account.deploy();
    }
    await account.waitConnected(CONNECT_TIMEOUT_SEC);

    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized({ timeoutInSeconds: SYNC_TIMEOUT_SEC });

    const result = await connection.closePosition(positionId);

    return Response.json({
      success: true,
      positionId,
      stringCode: result?.stringCode || null,
      message: `Position ${positionId} closed successfully`,
    });
  } catch (error: any) {
    const msg = error.message || "Failed to close position";
    if (msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
      return Response.json(
        { error: "Cannot reach MetaAPI servers. Please try again in a moment." },
        { status: 502 }
      );
    }
    return Response.json({ error: msg }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/close-position",
};
