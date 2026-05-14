const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your Netlify frontend
app.use(cors({
  origin: ['https://lunasignals.netlify.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Forex Luna Signal Backend Running',
    timestamp: new Date().toISOString()
  });
});

// Trade execution endpoint
app.post('/api/trade', async (req, res) => {
  try {
    const { symbol, direction, lotSize, stopLoss, takeProfit, comment, metaToken, accountId } = req.body;

    // Validate required fields
    if (!symbol || !direction || !lotSize || !metaToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, direction, lotSize, metaToken'
      });
    }

    console.log(`[TRADE] ${direction} ${symbol} | Lot: ${lotSize} | Account: ${accountId}`);

    // TODO: Replace this with actual MetaAPI call
    // Example:
    // const response = await fetch(`https://mt-api-v1.new-york.agiliumtrade.ai/users/current/accounts/${accountId}/trade`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${metaToken}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     symbol,
    //     type: direction === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
    //     volume: lotSize,
    //     stopLoss,
    //     takeProfit,
    //     comment: comment || 'ForexLuna-Signal'
    //   })
    // });
    // const result = await response.json();

    // For now, simulate success (replace with real API call above)
    const result = {
      success: true,
      orderId: `ORDER-${Date.now()}`,
      symbol: symbol,
      direction: direction,
      lotSize: lotSize,
      message: 'Order processed successfully'
    };

    console.log('[TRADE] Success:', result);
    res.json(result);

  } catch (error) {
    console.error('[TRADE] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// TradingView webhook endpoint
app.post('/api/webhook', (req, res) => {
  try {
    const { symbol, action, secret } = req.body;
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key';

    if (secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ success: false, error: 'Invalid secret' });
    }

    console.log(`[WEBHOOK] ${action} ${symbol}`);

    // Process the webhook (you can add your logic here)
    res.json({
      success: true,
      message: 'Webhook received and processed',
      data: { symbol, action }
    });

  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Forex Luna Signal Backend running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`📈 Trade: http://localhost:${PORT}/api/trade`);
});