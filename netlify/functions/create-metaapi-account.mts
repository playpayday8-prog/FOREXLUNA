import crypto from "node:crypto";
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { platform, server, login, password } = body;

    if (!platform || !server || !login || !password) {
      return Response.json({ error: "Missing required fields: platform, server, login, and password are all required." }, { status: 400 });
    }

    const validPlatforms = ["mt4", "mt5"];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return Response.json({ error: "Invalid platform. Must be MT4 or MT5." }, { status: 400 });
    }

    const token = Netlify.env.get("METAAPI_MASTER_TOKEN");
    if (!token) {
      return Response.json({ error: "MetaAPI is not configured. Please set the METAAPI_MASTER_TOKEN environment variable in the Netlify dashboard (Site settings > Environment variables)." }, { status: 503 });
    }

    const transactionId = crypto.randomUUID().replace(/-/g, "");

    const response = await fetch("https://provisioning-api-v1.agiliumtrade.ai/users/current/accounts", {
      method: "POST",
      headers: {
        "auth-token": token,
        "transaction-id": transactionId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `User Account ${login}`,
        login: String(login),
        password: String(password),
        server: String(server),
        platform: platform.toLowerCase(),
        magic: 1000,
        type: "cloud-g2",
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || response.statusText;
      return Response.json({ error: `MetaAPI Error: ${errorMessage}` }, { status: response.status });
    }

    const accountId = data?._id || data?.id;

    // Deploy the account so it starts connecting to the broker
    if (accountId) {
      await fetch(
        `https://provisioning-api-v1.agiliumtrade.ai/users/current/accounts/${accountId}/deploy`,
        {
          method: "POST",
          headers: { "auth-token": token },
        }
      ).catch(() => {});

      // Poll for connection status (up to 15 seconds)
      let connectionStatus = data?.connectionStatus || "DEPLOYING";
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch(
          `https://provisioning-api-v1.agiliumtrade.ai/users/current/accounts/${accountId}`,
          { headers: { "auth-token": token } }
        ).catch(() => null);

        if (statusRes && statusRes.ok) {
          const statusData = await statusRes.json().catch(() => null);
          connectionStatus = statusData?.connectionStatus || connectionStatus;
          if (connectionStatus === "CONNECTED") break;
        }
      }

      return Response.json({
        success: true,
        accountId,
        connectionStatus,
        broker: data?.broker || server,
        message: "Account created and connected successfully!",
      });
    }

    return Response.json({
      success: true,
      accountId,
      connectionStatus: data?.connectionStatus || "DEPLOYED",
      broker: data?.broker || server,
      message: "Account created successfully!",
    });
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/create-metaapi-account",
};
