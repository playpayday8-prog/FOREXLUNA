import type { Config } from "@netlify/functions";
import MetaApi from "metaapi.cloud-sdk/node";

const CONNECT_TIMEOUT_SEC = 60;
const SYNC_TIMEOUT_SEC = 60;

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
      return Response.json({ error: "MetaAPI not configured" }, { status: 503 });
    }

    const { accountId } = body;

    const api = new MetaApi(token);
    const account = await api.metatraderAccountApi.getAccount(accountId);
    const state = account.state;

    if (state !== "DEPLOYED") {
      await account.deploy();
      try {
        await account.waitConnected(CONNECT_TIMEOUT_SEC);
      } catch {
        return Response.json({
          synchronized: false,
          connectionStatus: state || "DEPLOYING",
          message: "Account is still deploying. Please poll again shortly.",
        });
      }
    }

    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized({ timeoutInSeconds: SYNC_TIMEOUT_SEC });

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
  } catch (error: any) {
    const msg = error.message || "Internal Server Error";
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
  path: "/api/metaapi-account-info",
};
