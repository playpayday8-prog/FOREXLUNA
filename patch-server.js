const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const newEndpoint = `
app.post('/api/create-metaapi-account', async (req, res) => {
  try {
    const { platform, server: mtServer, login, password } = req.body;

    if (!platform || !mtServer || !login || !password) {
      return res.status(400).json({ error: "Missing MT5 credentials" });
    }

    const token = process.env.METAAPI_MASTER_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "Missing METAAPI_MASTER_TOKEN in environment" });
    }

    const crypto = require('crypto');
    const transactionId = crypto.randomUUID().replace(/-/g, '');

    const fetch = (await import('node-fetch')).default || globalThis.fetch;
    const response = await fetch("https://provisioning-api-v1.agiliumtrade.ai/users/current/accounts", {
      method: "POST",
      headers: {
        "auth-token": token,
        "transaction-id": transactionId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: \`User Account \${login}\`,
        login: login,
        password: password,
        server: mtServer,
        platform: platform.toLowerCase(),
        magic: 1000,
        type: "cloud-g2"
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || response.statusText;
      return res.status(response.status).json({ error: \`MetaAPI Error: \${errorMessage}\` });
    }

    return res.json({
      success: true,
      accountId: data?._id || data?.id || \`metaapi-\${Date.now()}\`,
      connectionStatus: data?.connectionStatus || "CONNECTED",
      message: "Account created successfully in MetaAPI!"
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});
`;

if (!server.includes('/api/create-metaapi-account')) {
    server = server.replace("app.listen(PORT", newEndpoint + "\napp.listen(PORT");
    fs.writeFileSync('server.js', server);
    console.log('Successfully patched server.js');
}
