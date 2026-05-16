import type { Config } from "@netlify/functions";

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

    const infoRes = await fetch(
      `https://mt-client-api-v1.agiliumtrade.ai/users/current/accounts/${accountId}/account-information`,
      {
        headers: {
          "auth-token": token,
          "Content-Type": "application/json",
        },
      }
    );

    if (!infoRes.ok) {
      const errData = await infoRes.json().catch(() => null);
      const msg = errData?.message || errData?.error || infoRes.statusText;
      return Response.json({ error: `MetaAPI Error: ${msg}` }, { status: infoRes.status });
    }

    const info = await infoRes.json();

    return Response.json({
      balance: info.balance ?? 0,
      equity: info.equity ?? 0,
      profit: info.profit ?? 0,
      margin: info.margin ?? 0,
      freeMargin: info.freeMargin ?? 0,
      leverage: info.leverage ?? 0,
      currency: info.currency ?? "USD",
      broker: info.broker ?? "",
      server: info.server ?? "",
      platform: info.platform ?? "",
      name: info.name ?? "",
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: "/api/metaapi-account-info",
};
