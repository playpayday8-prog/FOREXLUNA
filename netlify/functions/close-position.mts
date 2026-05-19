import type { Config } from "@netlify/functions";
import MetaApi from "metaapi.cloud-sdk/node";

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

    await account.deploy();
    await account.waitConnected();

    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();

    const result = await connection.closePosition(positionId);

    return Response.json({
      success: true,
      positionId,
      stringCode: result?.stringCode || null,
      message: `Position ${positionId} closed successfully`,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to close position" },
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: "/api/close-position",
};
