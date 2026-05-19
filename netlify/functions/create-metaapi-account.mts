import crypto from "node:crypto";
import type { Config } from "@netlify/functions";
import MetaApi from "metaapi.cloud-sdk/esm-node";

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

    const { platform, server, login, password } = body;

    if (!platform || !server || !login || !password) {
      return Response.json(
        { error: "Missing required fields: platform, server, login, and password are all required." },
        { status: 400 }
      );
    }

    const validPlatforms = ["mt4", "mt5"];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return Response.json({ error: "Invalid platform. Must be MT4 or MT5." }, { status: 400 });
    }

    const token = Netlify.env.get("METAAPI_MASTER_TOKEN");
    if (!token) {
      return Response.json(
        { error: "MetaAPI is not configured. Please set the METAAPI_MASTER_TOKEN environment variable in the Netlify dashboard (Site settings > Environment variables)." },
        { status: 503 }
      );
    }

    const transactionId = crypto.randomUUID().replace(/-/g, "");

    const provisioningResponse = await fetch(
      "https://provisioning-api-v1.agiliumtrade.ai/users/current/accounts",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
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
      }
    );

    const provisioningData = await provisioningResponse.json().catch(() => null);

    if (!provisioningResponse.ok) {
      const errorMessage = provisioningData?.message || provisioningData?.error || provisioningResponse.statusText;
      return Response.json(
        { error: `MetaAPI Error: ${errorMessage}` },
        { status: provisioningResponse.status }
      );
    }

    const accountId = provisioningData?._id || provisioningData?.id;
    if (!accountId) {
      return Response.json(
        { error: "Account created but no ID returned from MetaAPI" },
        { status: 502 }
      );
    }

    try {
      const api = new MetaApi(token);
      const account = await api.metatraderAccountApi.getAccount(accountId);

      await account.deploy();
      await account.waitConnected(CONNECT_TIMEOUT_SEC);

      const connection = account.getRPCConnection();
      await connection.connect();
      await connection.waitSynchronized({ timeoutInSeconds: SYNC_TIMEOUT_SEC });

      const accountInfo = connection.terminalState.accountInformation;
      const positions = connection.terminalState.positions || [];
      const orders = connection.terminalState.orders || [];

      return Response.json({
        success: true,
        accountId,
        connectionStatus: "SYNCHRONIZED",
        broker: provisioningData?.broker || server,
        accountInformation: accountInfo,
        positions,
        orders,
        message: "Account created and connected successfully!",
      });
    } catch (syncError: any) {
      return Response.json({
        success: true,
        accountId,
        connectionStatus: "DEPLOYING",
        broker: provisioningData?.broker || server,
        message: "Account created. Synchronization in progress — use polling to check status.",
      });
    }
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
  path: "/api/create-metaapi-account",
};
