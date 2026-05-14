import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { db } from "../../db/index.js";
import { userSettings } from "../../db/schema.js";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const { user } = JSON.parse(event.body || "{}");

  if (user?.id) {
    await db.insert(userSettings).values({
      userId: user.id,
      savedAccounts: [],
      propSettings: {},
      tradeHistory: [],
      metaToken: "",
      preferences: {},
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        ...user?.app_metadata,
        roles: ["member"],
      },
    }),
  };
};

export { handler };
