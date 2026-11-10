const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDb } = require('./src/config/db');
const billRoutes = require('./src/routes/billRoutes');
const productRoutes = require('./src/routes/productRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const backupRoutes = require('./src/routes/backupRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Permissive CORS for Vercel, Hostinger, Localhost & Custom Domains
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'A-One Trade & Supply Network Billing API',
    database: 'MySQL',
    db_name: process.env.DB_NAME || 'u468502783_aone_billing',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/bills', billRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/backup', backupRoutes);

// Static frontend serving (if public folder exists)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Fallback to index.html for single-page application routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.json({
        message: 'A-One Billing API is running live on Hostinger.',
        endpoints: ['/api/health', '/api/bills', '/api/products', '/api/customers', '/api/reports/stats', '/api/reports/annual']
      });
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize DB and Start Server
async function startServer() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` A-One Billing System Server Running on Port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Database: MySQL (${process.env.DB_NAME || 'u468502783_aone_billing'})`);
    console.log(`====================================================`);
  });
}

startServer();

module.exports = app;
