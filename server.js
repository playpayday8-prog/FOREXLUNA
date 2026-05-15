const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['https://lunasignals.netlify.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Forex Luna Signal Backend Running',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/trade', async (req, res) => {
  try {
    const { symbol, direction, lotSize, stopLoss, takeProfit, comment, accountId } = req.body;

    if (!symbol || !direction || !lotSize) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    console.log(`[TRADE] ${direction} ${symbol} | Lot: ${lotSize}`);

    const result = {
      success: true,
      orderId: `ORDER-${Date.now()}`,
      symbol: symbol,
      direction: direction,
      lotSize: lotSize,
      message: 'Order processed successfully'
    };

    res.json(result);

  } catch (error) {
    console.error('[TRADE] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

app.post('/api/webhook', (req, res) => {
  const { symbol, action, secret } = req.body;
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key';
  
  if (secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, error: 'Invalid secret' });
  }

  console.log(`[WEBHOOK] ${action} ${symbol}`);
  res.json({ success: true, message: 'Webhook received' });
});


app.post('/api/create-metaapi-account', async (req, res) => {
  try {
    const { platform, server: mtServer, login, password } = req.body;

    if (!platform || !mtServer || !login || !password) {
      return res.status(400).json({ error: "Missing required fields: platform, server, login, and password are all required." });
    }

    const validPlatforms = ['mt4', 'mt5'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({ error: "Invalid platform. Must be MT4 or MT5." });
    }

    const token = process.env.METAAPI_MASTER_TOKEN;
    if (!token) {
      return res.status(503).json({ error: "MetaAPI is not configured. Please set the METAAPI_MASTER_TOKEN environment variable." });
    }

    const crypto = require('crypto');
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
        login: String(login),
        password: String(password),
        server: String(mtServer),
        platform: platform.toLowerCase(),
        magic: 1000,
        type: "cloud-g2"
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || response.statusText;
      return res.status(response.status).json({ error: `MetaAPI Error: ${errorMessage}` });
    }

    return res.json({
      success: true,
      accountId: data?._id || data?.id,
      connectionStatus: data?.connectionStatus || "CONNECTED",
      message: "Account connected successfully via MetaAPI!"
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});