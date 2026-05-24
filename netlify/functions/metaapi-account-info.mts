import type { Config } from "@netlify/functions";
import MetaApi from "metaapi.cloud-sdk/esm-node";

const CONNECT_TIMEOUT_SEC = 45;
const SYNC_TIMEOUT_SEC = 45;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const getPositionPrice = (position: Record<string, any>) =>
  position.currentPrice ??
  position.price ??
  position.openPrice ??
  position.marketPrice ??
  null;

const getSymbolPrices = (positions: Record<string, any>[], orders: Record<string, any>[]) => {
  const prices: Record<string, number> = {};
  for (const item of [...positions, ...orders]) {
    const symbol = item.symbol;
    const price = getPositionPrice(item);
    if (symbol && typeof price === "number") {
      prices[symbol] = price;
    }
  }
  return prices;
};

const isRetryableError = (msg: string) =>
  msg.includes("ENOTFOUND") ||
  msg.includes("ECONNREFUSED") ||
  msg.includes("ECONNRESET") ||
  msg.includes("ETIMEDOUT") ||
  msg.includes("fetch failed") ||
  msg.includes("socket hang up") ||
  msg.includes("network") ||
  msg.includes("timeout") ||
  msg.includes("TimeoutError") ||
  msg.includes("NotConnectedError") ||
  msg.includes("NotSynchronizedError");

async function connectAndSync(token: string, accountId: string) {
  const api = new MetaApi(token);
  const account = await api.metatraderAccountApi.getAccount(accountId);
  const state = account.state;

  if (state !== "DEPLOYED") {
    await account.deploy();
    await account.waitConnected(CONNECT_TIMEOUT_SEC);
  }

  const connection = account.getRPCConnection();
  await connection.connect();
  await connection.waitSynchronized({ timeoutInSeconds: SYNC_TIMEOUT_SEC });

  return { account, connection, state };
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.accountId) {
      return Response.json({ error: "Missing accountId" }, { status: 400 });
    }

    const token = Netlify.env.get("METAAPI_MASTER_TOKEN");
    if (!token) {
      return Response.json({ error: "MetaAPI not configured. Set METAAPI_MASTER_TOKEN in Netlify environment variables." }, { status: 503 });
    }

    const { accountId } = body;
    let lastError: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          await sleep(RETRY_DELAY_MS * attempt);
        }

        const { connection, state } = await connectAndSync(token, accountId);

        const info = connection.terminalState.accountInformation || {};
        const positions = connection.terminalState.positions || [];
        const orders = connection.terminalState.orders || [];
        const floatingProfit = positions.reduce(
          (sum: number, position: Record<string, any>) => sum + (Number(position.profit) || 0),
          0
        );

        return Response.json({
          synchronized: true,
          balance: info.balance ?? 0,
          equity: info.equity ?? 0,
          profit: info.profit ?? floatingProfit,
          margin: info.margin ?? 0,
          freeMargin: info.freeMargin ?? 0,
          leverage: info.leverage ?? 0,
          currency: info.currency ?? "USD",
          broker: info.broker ?? "",
          server: info.server ?? "",
          platform: info.platform ?? "",
          name: info.name ?? "",
          accountInformation: info,
          positions,
          orders,
          symbolPrices: getSymbolPrices(positions, orders),
        });
      } catch (err: any) {
        lastError = err;
        const msg = err.message || "";

        if (msg.includes("not found") || msg.includes("NotFoundError")) {
          return Response.json({ error: "Account not found. Check your MetaAPI account ID." }, { status: 404 });
        }

        if (msg.includes("DEPLOYING") || msg.includes("deploying")) {
          return Response.json({
            synchronized: false,
            connectionStatus: "DEPLOYING",
            message: "Account is still deploying. Please poll again shortly.",
          });
        }

        if (attempt < MAX_RETRIES && isRetryableError(msg)) {
          continue;
        }
      }
    }

    const msg = lastError?.message || "Internal Server Error";
    if (isRetryableError(msg)) {
      return Response.json(
        { error: "Cannot reach MetaAPI servers after multiple attempts. Please try again in a moment.", retryable: true },
        { status: 502 }
      );
    }
    return Response.json({ error: msg }, { status: 500 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/metaapi-account-info",
};
