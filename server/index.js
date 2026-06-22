require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const uploadRoutes = require('./routes/upload');
const checkoutRoutes = require('./routes/checkout');
const webhookRoutes = require('./routes/webhook');

const app = express();

// ─── Webhook Stripe DOIT être avant express.json() ───
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// ─── Middlewares globaux ───
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ─── Routes ───
app.use('/api/upload', uploadRoutes);
app.use('/api/checkout', checkoutRoutes);

// ─── Page principale ───
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── Gestion des erreurs ───
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
