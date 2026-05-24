import type { Config } from "@netlify/functions";
import MetaApi from "metaapi.cloud-sdk/esm-node";

const CONNECT_TIMEOUT_SEC = 45;
const SYNC_TIMEOUT_SEC = 45;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isRetryableError = (msg: string) =>
  msg.includes("ENOTFOUND") ||
  msg.includes("ECONNREFUSED") ||
  msg.includes("ECONNRESET") ||
  msg.includes("ETIMEDOUT") ||
  msg.includes("fetch failed") ||
  msg.includes("socket hang up") ||
  msg.includes("timeout") ||
  msg.includes("TimeoutError") ||
  msg.includes("NotConnectedError") ||
  msg.includes("NotSynchronizedError");

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

    let lastError: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          await sleep(RETRY_DELAY_MS * attempt);
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
      } catch (err: any) {
        lastError = err;
        const msg = err.message || "";

        if (msg.includes("not found") || msg.includes("NotFoundError")) {
          return Response.json({ error: "Account or position not found." }, { status: 404 });
        }

        if (attempt < MAX_RETRIES && isRetryableError(msg)) {
          continue;
        }
      }
    }

    const msg = lastError?.message || "Failed to close position";
    if (isRetryableError(msg)) {
      return Response.json(
        { error: "Cannot reach MetaAPI servers after multiple attempts. Please try again.", retryable: true },
        { status: 502 }
      );
    }
    return Response.json({ error: msg }, { status: 500 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to close position" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/close-position",
};
