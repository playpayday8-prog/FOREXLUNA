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
    const { symbol, direction, lotSize, stopLoss, takeProfit, comment, metaToken, accountId } = req.body;

    if (!symbol || !direction || !lotSize || !metaToken) {
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

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});