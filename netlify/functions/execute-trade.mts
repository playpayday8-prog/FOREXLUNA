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

    const { accountId, action, symbol, volume, stopLoss, takeProfit, comment } = body;

    if (!accountId || !action || !symbol || !volume) {
      return Response.json(
        { error: "Missing required fields: accountId, action, symbol, volume" },
        { status: 400 }
      );
    }

    const validActions = ["BUY", "SELL"];
    if (!validActions.includes(action.toUpperCase())) {
      return Response.json({ error: "Invalid action. Must be BUY or SELL." }, { status: 400 });
    }

    const lotSize = parseFloat(volume);
    if (isNaN(lotSize) || lotSize < 0.01 || lotSize > 100) {
      return Response.json({ error: "Invalid volume. Must be between 0.01 and 100." }, { status: 400 });
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

        let result: any;
        const tradeComment = comment || "LunaSignals";

        if (action.toUpperCase() === "BUY") {
          const options: Record<string, any> = { comment: tradeComment };
          if (typeof stopLoss === "number") options.stopLoss = stopLoss;
          if (typeof takeProfit === "number") options.takeProfit = takeProfit;

          result = await connection.createMarketBuyOrder(symbol, lotSize, options);
        } else {
          const options: Record<string, any> = { comment: tradeComment };
          if (typeof stopLoss === "number") options.stopLoss = stopLoss;
          if (typeof takeProfit === "number") options.takeProfit = takeProfit;

          result = await connection.createMarketSellOrder(symbol, lotSize, options);
        }

        return Response.json({
          success: true,
          orderId: result?.orderId || result?.positionId || null,
          stringCode: result?.stringCode || null,
          message: `${action.toUpperCase()} order for ${lotSize} lots of ${symbol} executed successfully`,
        });
      } catch (err: any) {
        lastError = err;
        const msg = err.message || "";

        if (msg.includes("not found") || msg.includes("NotFoundError")) {
          return Response.json({ error: "Account not found. Check your MetaAPI account ID." }, { status: 404 });
        }

        if (attempt < MAX_RETRIES && isRetryableError(msg)) {
          continue;
        }
      }
    }

    const msg = lastError?.message || "Trade execution failed";
    if (isRetryableError(msg)) {
      return Response.json(
        { error: "Cannot reach MetaAPI servers after multiple attempts. Please try again.", retryable: true },
        { status: 502 }
      );
    }
    const status = msg.includes("not found") ? 404 : 500;
    return Response.json({ error: msg }, { status });
  } catch (error: any) {
    return Response.json({ error: error.message || "Trade execution failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/execute-trade",
};
