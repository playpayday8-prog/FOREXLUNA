import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const token = Netlify.env.get("METAAPI_MASTER_TOKEN");
  if (!token) {
    return Response.json({
      status: "unconfigured",
      message: "METAAPI_MASTER_TOKEN is not set. Add it in Netlify Site settings > Environment variables.",
    }, { status: 503 });
  }

  try {
    const res = await fetch("https://mt-provisioning-api-v1.agiliumtrade.ai/users/current", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      return Response.json({
        status: "connected",
        message: "MetaAPI token is valid and servers are reachable.",
      });
    }

    if (res.status === 401) {
      return Response.json({
        status: "invalid_token",
        message: "MetaAPI token is invalid or expired. Update METAAPI_MASTER_TOKEN in environment variables.",
      }, { status: 401 });
    }

    return Response.json({
      status: "error",
      message: `MetaAPI returned status ${res.status}. The service may be temporarily unavailable.`,
    }, { status: 502 });
  } catch (error: any) {
    const msg = error.message || "";
    if (msg.includes("timeout") || msg.includes("abort")) {
      return Response.json({
        status: "timeout",
        message: "MetaAPI servers did not respond within 10 seconds. They may be experiencing issues.",
      }, { status: 504 });
    }
    return Response.json({
      status: "unreachable",
      message: "Cannot reach MetaAPI servers. Check your network or try again later.",
    }, { status: 502 });
  }
};

export const config: Config = {
  path: "/api/metaapi-health",
};
