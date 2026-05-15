import crypto from "node:crypto";
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { platform, server, login, password } = await req.json();

    if (!platform || !server || !login || !password) {
      return Response.json({ error: "Missing MT5 credentials" }, { status: 400 });
    }

    const token = process.env.METAAPI_MASTER_TOKEN;
    if (!token) {
      return Response.json({ error: "Server configuration error: METAAPI_MASTER_TOKEN environment variable is not set. Please add it in the Netlify dashboard under Site settings > Environment variables." }, { status: 500 });
    }

    const transactionId = crypto.randomUUID().replace(/-/g, '');

    const response = await fetch("https://provisioning-api-v1.agiliumtrade.ai/users/current/accounts", {
      method: "POST",
      headers: {
        "auth-token": token,
        "transaction-id": transactionId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: `User Account ${login}`,
        login: login,
        password: password,
        server: server,
        platform: platform.toLowerCase(),
        magic: 1000,
        type: "cloud-g2"
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || response.statusText;
      return Response.json({ error: `MetaAPI Error: ${errorMessage}` }, { status: response.status });
    }

    return Response.json({
      success: true,
      accountId: data?._id || data?.id || `metaapi-${Date.now()}`,
      connectionStatus: data?.connectionStatus || "CONNECTED",
      message: "Account created successfully in MetaAPI!"
    });

  } catch (error: any) {
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/create-metaapi-account",
};
